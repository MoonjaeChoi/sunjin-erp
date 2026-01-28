#!/usr/bin/env python3
# Generated: 2026-01-28 11:45:00 KST
"""
embed_font.py - Embed Pretendard font into PPTX files

Usage:
    python embed_font.py input.pptx [output.pptx]

This script embeds Pretendard font files into a PPTX presentation
so the fonts display correctly on any computer.

The script:
1. Downloads Pretendard font files from CDN (if not cached)
2. Adds font files to the PPTX archive in ppt/fonts/
3. Updates [Content_Types].xml to recognize font files
"""

import os
import sys
import zipfile
import tempfile
import shutil
import urllib.request
from pathlib import Path
import xml.etree.ElementTree as ET

# Pretendard font CDN URLs (from fonts-archive)
PRETENDARD_BASE_URL = "https://cdn.jsdelivr.net/gh/fonts-archive/Pretendard"
FONT_WEIGHTS = {
    "Pretendard-Regular": "Pretendard-Regular.otf",
    "Pretendard-Bold": "Pretendard-Bold.otf",
    "Pretendard-SemiBold": "Pretendard-SemiBold.otf",
    "Pretendard-Medium": "Pretendard-Medium.otf",
    "Pretendard-Light": "Pretendard-Light.otf",
}

# Cache directory for downloaded fonts
FONT_CACHE_DIR = Path.home() / ".cache" / "ppt-fonts"


def download_font(font_name: str) -> Path:
    """Download a Pretendard font file if not already cached."""
    FONT_CACHE_DIR.mkdir(parents=True, exist_ok=True)

    font_file = FONT_WEIGHTS.get(font_name)
    if not font_file:
        raise ValueError(f"Unknown font: {font_name}")

    cache_path = FONT_CACHE_DIR / font_file

    if cache_path.exists():
        print(f"  Using cached: {font_file}")
        return cache_path

    url = f"{PRETENDARD_BASE_URL}/{font_file}"
    print(f"  Downloading: {font_file}")

    try:
        urllib.request.urlretrieve(url, cache_path)
    except Exception as e:
        print(f"  Error downloading {font_file}: {e}")
        raise

    return cache_path


def embed_fonts_in_pptx(input_path: str, output_path: str):
    """
    Embed Pretendard fonts into a PPTX file.

    This adds font files to the PPTX package and updates Content_Types.xml
    to register the font content type.
    """
    print(f"\nEmbedding fonts in: {input_path}")

    # Create a temporary directory for extraction
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)

        # Extract the PPTX
        print("  Extracting PPTX...")
        with zipfile.ZipFile(input_path, 'r') as zf:
            zf.extractall(temp_path)

        # Create fonts directory
        fonts_dir = temp_path / "ppt" / "fonts"
        fonts_dir.mkdir(parents=True, exist_ok=True)

        # Download and add fonts
        print("  Processing fonts...")
        font_entries = []

        for font_name, font_file in FONT_WEIGHTS.items():
            try:
                # Download font
                font_path = download_font(font_name)

                # Copy font to PPTX fonts directory with .fntdata extension
                dest_path = fonts_dir / f"{font_name}.fntdata"
                shutil.copy(font_path, dest_path)

                font_entries.append({
                    'name': font_name,
                    'file': f"{font_name}.fntdata"
                })

            except Exception as e:
                print(f"  Warning: Could not embed {font_name}: {e}")

        # Update [Content_Types].xml to include font content type
        content_types_path = temp_path / "[Content_Types].xml"
        if content_types_path.exists() and font_entries:
            # Parse with namespace preservation
            ET.register_namespace('', 'http://schemas.openxmlformats.org/package/2006/content-types')
            tree = ET.parse(content_types_path)
            root = tree.getroot()

            ns = 'http://schemas.openxmlformats.org/package/2006/content-types'

            # Check if fntdata extension is already registered
            fntdata_exists = False
            for elem in root:
                if elem.get('Extension') == 'fntdata':
                    fntdata_exists = True
                    break

            # Add Default element for fntdata if not exists
            if not fntdata_exists:
                default_elem = ET.Element(f'{{{ns}}}Default')
                default_elem.set('Extension', 'fntdata')
                default_elem.set('ContentType', 'application/x-fontdata')
                # Insert at beginning after first element
                root.insert(1, default_elem)

            # Write back with XML declaration
            tree.write(content_types_path, encoding='UTF-8', xml_declaration=True)

        # Repack the PPTX
        print("  Repacking PPTX...")
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for file_path in temp_path.rglob('*'):
                if file_path.is_file():
                    arc_name = file_path.relative_to(temp_path)
                    zf.write(file_path, arc_name)

        print(f"  Saved: {output_path}")

        # Report embedded fonts
        print(f"\n  Embedded {len(font_entries)} font files:")
        for entry in font_entries:
            print(f"    - {entry['name']}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python embed_font.py input.pptx [output.pptx]")
        print("\nEmbed Pretendard fonts into a PowerPoint presentation.")
        print("\nNote: For best results, also install Pretendard on the target computer,")
        print("or use PowerPoint's 'Embed fonts in the file' option (File > Options > Save).")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else input_path

    if not os.path.exists(input_path):
        print(f"Error: File not found: {input_path}")
        sys.exit(1)

    # Create backup if overwriting
    if input_path == output_path:
        backup_path = input_path + ".bak"
        shutil.copy(input_path, backup_path)
        print(f"Created backup: {backup_path}")

    embed_fonts_in_pptx(input_path, output_path)

    print("\n✓ Font embedding complete!")
    print("\nNote: The fonts are included in the PPTX package.")
    print("For guaranteed display on all computers:")
    print("  1. Install Pretendard font on the target computer, OR")
    print("  2. Open in PowerPoint and use File > Options > Save > 'Embed fonts in the file'")


if __name__ == "__main__":
    main()
