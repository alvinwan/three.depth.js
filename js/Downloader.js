class Downloader {
    constructor(renderer) {
        this.renderer = renderer;

        // Initialize canvas for blob conversion
        this.canvas = document.createElement( 'canvas' );
	    this.ctx = this.canvas.getContext( '2d' );

        let size = new THREE.Vector2();
        this.renderer.getSize(size);
        this.setSize(size.x, size.y);
    }

    setSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = width;
        this.height = height;
    }

    download(image) {
        this.ctx.putImageData( image, 0, 0 );

        this.canvas.toBlob( function( blob ) {

            var url = URL.createObjectURL(blob);
            var fileName = 'image-' + document.title + '-' + Date.now() + '.png';
            var anchor = document.createElement( 'a' );
            anchor.href = url;
            anchor.setAttribute("download", fileName);
            anchor.className = "download-js-link";
            anchor.innerHTML = "downloading...";
            anchor.style.display = "none";
            document.body.appendChild(anchor);
            setTimeout(function() {
                anchor.click();
                document.body.removeChild(anchor);
            }, 1 );

        }, 'image/png' );
    }

    renderTargetToImage(renderTarget, flipH=false, flipV=false) {
        // Write render target depth to pixel array
        const raw = new Uint8Array( 4 * this.width * this.height );
        this.renderer.readRenderTargetPixels(renderTarget, 0, 0, this.width, this.height, raw);

        // Flip pixels vertically. For some reason, all pixel arrays are flipped vertically.
        const pixels = Downloader.flipPixels(raw, this.width, this.height, flipH, flipV);

        // Create image from pixel array
        const image = new ImageData( new Uint8ClampedArray( pixels ), this.width, this.height );

        return image;
    }

    static flipPixels(pixels, width, height, flipH=false, flipV=false) {
        const flipped = new Uint8Array(4 * width * height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const fy = flipV ? height - y - 1 : y;
                const fx = flipH ? width - x - 1 : x;
                const flippedIndex = (fy * width + fx) * 4;
                for (let i = 0; i < 4; i++) {
                    flipped[flippedIndex + i] = pixels[index + i];
                }
            }
        }
        return flipped;
    }
}