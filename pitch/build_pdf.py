"""Render index.html pitch deck to a multi-page PDF — one page per slide."""
import asyncio
import base64
from pathlib import Path
from playwright.async_api import async_playwright


async def main():
    root = Path(__file__).parent
    html_path = root / "index.html"
    pdf_path = root / "raze-pitch.pdf"
    total_slides = 6

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            device_scale_factor=2,
        )
        page = await context.new_page()
        await page.goto(f"file://{html_path.resolve()}")
        await page.wait_for_load_state("networkidle")
        await page.evaluate("document.fonts.ready")
        await page.wait_for_timeout(800)

        # Capture each slide as PNG bytes
        slide_b64 = []
        for i in range(total_slides):
            await page.evaluate(f"goToSlide({i})")
            await page.wait_for_timeout(600)
            img_bytes = await page.screenshot(full_page=False)
            slide_b64.append(base64.b64encode(img_bytes).decode())
            print(f"  captured slide {i + 1}/{total_slides}")

        # Build PDF from inline base64 images
        pdf_page = await context.new_page()
        slides_html = "".join(
            f'<div style="width:1920px;height:1080px;page-break-after:always;">'
            f'<img src="data:image/png;base64,{b64}" style="width:1920px;height:1080px;display:block;">'
            f'</div>'
            for b64 in slide_b64
        )
        await pdf_page.set_content(
            f'<html><body style="margin:0;padding:0;background:#000;">{slides_html}</body></html>',
            wait_until="load",
        )
        await pdf_page.wait_for_timeout(1000)

        await pdf_page.pdf(
            path=str(pdf_path),
            width="1920px",
            height="1080px",
            print_background=True,
            prefer_css_page_size=False,
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
        )
        await browser.close()

    size_kb = pdf_path.stat().st_size / 1024
    print(f"\n✅ PDF created: {pdf_path}")
    print(f"   {total_slides} slides · {size_kb:.0f} KB")


if __name__ == "__main__":
    asyncio.run(main())
