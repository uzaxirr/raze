"""Test script to verify xAI tool call content leakage issue"""

import os
from agno.agent import Agent
from agno.models.xai import xAI
from agno.tools import tool

os.environ["XAI_API_KEY"] = "xai-bS9k9gxZJhdpZMMaP9gwwQOvEv002UVLm0EyfHvm3kE6hDOsLnL6gLrD0T7x8rUlwTw8pQLmYZMeBOa0"


@tool
def get_customer_data(customer_name: str) -> str:
    """Get customer settlement data by name.

    Args:
        customer_name: The name of the customer to look up
    """
    # Simulate database response
    return """
    Customer: THE YOUNG CLINIC
    Customer ID: 8879
    Recent Settlements:
    - 2026-01-06: £718.25 (12 transactions)
    - 2026-01-04: £1,245.50 (18 transactions)
    - 2026-01-03: £892.00 (15 transactions)
    Note: No settlement on 2026-01-05
    """


def test_model(model_id: str):
    print(f"\n{'='*60}")
    print(f"Testing model: {model_id}")
    print('='*60)

    try:
        agent = Agent(
            name="TestAgent",
            description="Test agent for tool call verification",
            instructions="You are a helpful assistant. Use tools when needed to answer questions. Be concise.",
            model=xAI(id=model_id, temperature=0.1),
            tools=[get_customer_data],
            stream=True,  # Customer has streaming enabled
            markdown=True,
            debug_mode=False,
        )

        # Test question that should trigger tool call
        response = agent.run("What is yesterday's settlement for THE YOUNG CLINIC?")

        # Handle streaming response
        content = ""
        if hasattr(response, '__iter__') and not isinstance(response, str):
            # It's a generator/stream
            for chunk in response:
                if hasattr(chunk, 'content') and chunk.content:
                    content += chunk.content
        elif response and hasattr(response, 'content') and response.content:
            content = response.content

        print(f"\nResponse content:")
        print("-" * 40)
        if content:
            print(content)
        else:
            print("(No content)")

        # Check for tool call XML leakage
        if content:
            has_leak = any(x in content.lower() for x in [
                "function_call",
                "<parameter",
                "tool_call",
                "</xai:",
                "<xai:",
                "has_function_call"
            ])
            print("-" * 40)
            if has_leak:
                print("WARNING: Tool call XML detected in response!")
            else:
                print("OK: No tool call XML leakage detected")
        else:
            print("-" * 40)
            print("SKIPPED: No content to check")

    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    # Test customer's model multiple times to catch intermittent issue
    models_to_test = [
        "grok-2",  # Known to have issue
    ]

    print("Running 3 iterations with grok-2...")
    for i in range(3):
        print(f"\n>>> ITERATION {i+1} <<<")
        for model_id in models_to_test:
            test_model(model_id)

    print("\n" + "="*60)
    print("Testing complete!")
