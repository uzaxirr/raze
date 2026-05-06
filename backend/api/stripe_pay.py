"""Stripe payment integration for Raze Unleashed subscriptions."""

import os
import logging
from typing import Optional

import stripe
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/stripe", tags=["stripe"])

# ── Config ──
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_PRICE_ID = os.getenv("STRIPE_PRICE_ID", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
FRONTEND_URL = os.getenv("RAZE_FRONTEND_URL", "https://raze.fun")


@router.post("/checkout")
async def create_checkout_session(request: Request):
    """Create a Stripe Checkout session for Raze Unleashed.

    Body: { "telegram_user_id": 12345 }  (optional, for linking)
    Returns: { "url": "https://checkout.stripe.com/..." }
    """
    if not stripe.api_key or not STRIPE_PRICE_ID:
        raise HTTPException(500, "Stripe not configured")

    body = await request.json()
    telegram_user_id = body.get("telegram_user_id")
    email = body.get("email")

    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            line_items=[{"price": STRIPE_PRICE_ID, "quantity": 1}],
            success_url=f"{FRONTEND_URL}/unleashed/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/unleashed",
            metadata={
                "telegram_user_id": str(telegram_user_id) if telegram_user_id else "",
                "product": "raze_unleashed",
            },
            customer_email=email if email else None,
        )
        return {"url": session.url}
    except stripe.StripeError as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(502, f"Stripe error: {str(e)}")


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events.

    Events:
      - checkout.session.completed → activate subscription
      - customer.subscription.deleted → deactivate subscription
      - invoice.payment_failed → mark past_due
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    if STRIPE_WEBHOOK_SECRET:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        except stripe.SignatureVerificationError:
            raise HTTPException(400, "Invalid signature")
    else:
        # No webhook secret — parse directly (dev mode only)
        import json
        event = json.loads(payload)

    event_type = event.get("type") if isinstance(event, dict) else event.type
    data = event.get("data", {}).get("object", {}) if isinstance(event, dict) else event.data.object

    if event_type == "checkout.session.completed":
        await _handle_checkout_completed(data)
    elif event_type == "customer.subscription.deleted":
        await _handle_subscription_cancelled(data)
    elif event_type == "invoice.payment_failed":
        await _handle_payment_failed(data)

    return JSONResponse({"status": "ok"})


async def _handle_checkout_completed(session):
    """Activate Unleashed after successful Stripe checkout."""
    metadata = session.get("metadata", {}) if isinstance(session, dict) else session.metadata
    customer_id = session.get("customer", "") if isinstance(session, dict) else session.customer
    subscription_id = session.get("subscription", "") if isinstance(session, dict) else session.subscription
    customer_email = session.get("customer_email") or session.get("customer_details", {}).get("email", "")

    telegram_user_id = metadata.get("telegram_user_id", "")
    tg_id = int(telegram_user_id) if telegram_user_id else None

    from db.subscription import activate_unleashed
    sub = activate_unleashed(
        telegram_user_id=tg_id,
        email=customer_email,
        payment_method="stripe",
        stripe_customer_id=customer_id,
        stripe_subscription_id=subscription_id,
    )

    logger.info(f"Unleashed activated via Stripe: tg={tg_id}, email={customer_email}, sub={subscription_id}")


async def _handle_subscription_cancelled(subscription):
    """Deactivate when Stripe subscription is cancelled."""
    customer_id = subscription.get("customer", "") if isinstance(subscription, dict) else subscription.customer

    try:
        from db.database import SessionLocal
        from db.models import Subscription
        with SessionLocal() as db:
            sub = db.query(Subscription).filter_by(stripe_customer_id=customer_id).first()
            if sub:
                sub.status = "cancelled"
                db.commit()
                logger.info(f"Unleashed cancelled for stripe customer {customer_id}")
    except Exception as e:
        logger.error(f"Failed to cancel subscription: {e}")


async def _handle_payment_failed(invoice):
    """Mark subscription as past_due on failed payment."""
    customer_id = invoice.get("customer", "") if isinstance(invoice, dict) else invoice.customer

    try:
        from db.database import SessionLocal
        from db.models import Subscription
        with SessionLocal() as db:
            sub = db.query(Subscription).filter_by(stripe_customer_id=customer_id).first()
            if sub:
                sub.status = "past_due"
                db.commit()
                logger.info(f"Payment failed for stripe customer {customer_id}")
    except Exception as e:
        logger.error(f"Failed to update subscription: {e}")
