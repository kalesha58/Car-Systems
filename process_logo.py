#!/usr/bin/env python3
"""
Script to process MotoNode logo image for iOS and Android app icons.
Removes white/dark backgrounds and generates all required sizes.
"""

from PIL import Image
import os
import sys

def remove_background(img, white_threshold=240, dark_threshold=120):
    """
    Remove white and dark gradient backgrounds from the image, making them transparent.
    Uses improved pixel-based approach to detect and remove background colors including gradients.
    """
    # Convert to RGBA if not already
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Load pixel data
    pixels = img.load()
    width, height = img.size
    
    # Get center coordinates for radial gradient detection
    center_x, center_y = width // 2, height // 2
    max_dist = ((center_x ** 2 + center_y ** 2) ** 0.5) * 1.3  # Slightly larger than corner distance
    
    # Detect background color from corners (most reliable for gradient backgrounds)
    corner_samples = [
        pixels[0, 0],
        pixels[width-1, 0],
        pixels[0, height-1],
        pixels[width-1, height-1],
        pixels[width//4, height//4],
        pixels[3*width//4, 3*height//4],
    ]
    
    # Calculate average background color from corners
    avg_r = sum(c[0] for c in corner_samples) // len(corner_samples)
    avg_g = sum(c[1] for c in corner_samples) // len(corner_samples)
    avg_b = sum(c[2] for c in corner_samples) // len(corner_samples)
    
    # Process each pixel
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Calculate distance from center for gradient detection
            dist_from_center = ((x - center_x) ** 2 + (y - center_y) ** 2) ** 0.5
            edge_factor = min(dist_from_center / max_dist, 1.0) if max_dist > 0 else 1.0
            
            # Calculate color similarity for white
            white_diff = abs(r - 255) + abs(g - 255) + abs(b - 255)
            is_white = white_diff < ((255 - white_threshold) * 3)
            
            # Check similarity to background gradient color
            # Background gets darker towards edges, so use adaptive threshold
            bg_diff = abs(r - avg_r) + abs(g - avg_g) + abs(b - avg_b)
            # At edges, be more aggressive in removing background
            adaptive_threshold = int(30 + (20 * edge_factor))  # 30 at center, 50 at edges
            is_background_gradient = bg_diff < adaptive_threshold and edge_factor > 0.3
            
            # Check for dark background (dark grey/charcoal) - more aggressive at edges
            adaptive_dark_threshold = int(dark_threshold - (30 * (1 - edge_factor)))  # Lower threshold at edges
            is_dark = (r < adaptive_dark_threshold and 
                      g < adaptive_dark_threshold and 
                      b < adaptive_dark_threshold)
            
            # Additional check: if the pixel is very close to black (likely gradient edge)
            is_very_dark = r < 40 and g < 40 and b < 40
            
            # Check if pixel is near edges (likely background in gradient images)
            is_near_edge = (x < width * 0.15 or x > width * 0.85 or 
                           y < height * 0.15 or y > height * 0.85)
            is_edge_dark = is_near_edge and (r < 120 and g < 120 and b < 120) and edge_factor > 0.5
            
            # Make background transparent
            if is_white or is_background_gradient or is_dark or is_very_dark or is_edge_dark:
                pixels[x, y] = (r, g, b, 0)  # Set alpha to 0 (transparent)
    
    return img

def create_icon_sizes(input_path, output_base_dir, sizes_dict):
    """
    Create icon files in different sizes.
    
    Args:
        input_path: Path to source image
        output_base_dir: Base directory for output
        sizes_dict: Dictionary with output paths as keys and sizes as values
    """
    # Load and process the original image
    print(f"Loading image from: {input_path}")
    img = Image.open(input_path)
    
    # Remove background
    print("Removing white/dark backgrounds...")
    img = remove_background(img)
    
    # Create output directory if it doesn't exist
    os.makedirs(output_base_dir, exist_ok=True)
    
    # Generate all sizes
    created_files = []
    for output_path, size in sizes_dict.items():
        full_path = os.path.join(output_base_dir, output_path)
        
        # Create subdirectories if needed
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        # Resize image
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        
        # Save as PNG
        resized.save(full_path, 'PNG')
        created_files.append(full_path)
        print(f"Created: {full_path} ({size}x{size})")
    
    return created_files

def main():
    # Paths
    base_dir = r"c:\Users\thejab\Desktop\Car-Systems"
    input_image = os.path.join(base_dir, "client", "src", "assets", "icons", "motoNode.png")
    client_dir = os.path.join(base_dir, "client")
    
    # iOS icon sizes (from Contents.json)
    ios_dir = os.path.join(client_dir, "ios", "CarConnect", "Images.xcassets", "AppIcon.appiconset")
    ios_sizes = {
        "icon-20@2x.png": 40,      # 20x20 @2x
        "icon-20@3x.png": 60,      # 20x20 @3x
        "icon-29@2x.png": 58,      # 29x29 @2x
        "icon-29@3x.png": 87,      # 29x29 @3x
        "icon-40@2x.png": 80,      # 40x40 @2x
        "icon-40@3x.png": 120,     # 40x40 @3x
        "icon-60@2x.png": 120,     # 60x60 @2x
        "icon-60@3x.png": 180,     # 60x60 @3x
        "icon-1024.png": 1024,     # Marketing icon
    }
    
    # Android icon sizes (mipmap densities)
    android_base = os.path.join(client_dir, "android", "app", "src", "main", "res")
    android_sizes = {
        "mipmap-mdpi/ic_launcher.png": 48,      # mdpi
        "mipmap-mdpi/ic_launcher_round.png": 48,
        "mipmap-hdpi/ic_launcher.png": 72,      # hdpi
        "mipmap-hdpi/ic_launcher_round.png": 72,
        "mipmap-xhdpi/ic_launcher.png": 96,     # xhdpi
        "mipmap-xhdpi/ic_launcher_round.png": 96,
        "mipmap-xxhdpi/ic_launcher.png": 144,   # xxhdpi
        "mipmap-xxhdpi/ic_launcher_round.png": 144,
        "mipmap-xxxhdpi/ic_launcher.png": 192,  # xxxhdpi
        "mipmap-xxxhdpi/ic_launcher_round.png": 192,
    }
    
    # Check if input file exists
    if not os.path.exists(input_image):
        print(f"Error: Input image not found at {input_image}")
        sys.exit(1)
    
    print("=" * 60)
    print("Processing MotoNode Logo for iOS and Android")
    print("=" * 60)
    print()
    
    # Generate iOS icons
    print("Generating iOS icons...")
    create_icon_sizes(input_image, ios_dir, ios_sizes)
    print()
    
    # Generate Android icons
    print("Generating Android icons...")
    create_icon_sizes(input_image, android_base, android_sizes)
    print()
    
    # Update iOS Contents.json with correct filenames
    contents_json_path = os.path.join(ios_dir, "Contents.json")
    if os.path.exists(contents_json_path):
        import json
        with open(contents_json_path, 'r') as f:
            contents = json.load(f)
        
        # Update filenames
        filename_map = {
            "icon-20@2x.png": 40,
            "icon-20@3x.png": 60,
            "icon-29@2x.png": 58,
            "icon-29@3x.png": 87,
            "icon-40@2x.png": 80,
            "icon-40@3x.png": 120,
            "icon-60@2x.png": 120,
            "icon-60@3x.png": 180,
            "icon-1024.png": 1024,
        }
        
        image_index = 0
        for filename, size in filename_map.items():
            if image_index < len(contents["images"]):
                contents["images"][image_index]["filename"] = filename
                image_index += 1
        
        with open(contents_json_path, 'w') as f:
            json.dump(contents, f, indent=2)
        print(f"Updated {contents_json_path}")
    
    print()
    print("=" * 60)
    print("All icons generated successfully!")
    print("=" * 60)
    print("\nNote: Round icons for Android are the same as square icons.")
    print("You may want to create proper round versions if needed.")

if __name__ == "__main__":
    main()
