class Material{ 
    constructor(gl, image_url, ext, scale, scale_axis){

        gl.bindTexture(gl.TEXTURE_2D, null); // free previous binding
        this.tex = gl.createTexture();
        this.ext = ext; // save extension context
        this.loaded = false;
        this.bind(gl);

        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA,
            256, 256, 0,
            gl.RGBA, gl.UNSIGNED_BYTE,
            Material.xor_texture(256)
        );
        gl.generateMipmap(gl.TEXTURE_2D);

        if(image_url == 'xor'){
            return;
        }

        let image = new Image();
        let _tex = this; //alias to this current material for event listener

        image.addEventListener('load', function(){

            _tex.bind(gl);

            gl.texImage2D(
                gl.TEXTURE_2D, 0, gl.RGBA,
                gl.RGBA, gl.UNSIGNED_BYTE, image
            );

            _tex.width = image.width;
            _tex.height = image.height;

            // update scale
            let scale_values = glMatrix.vec2.fromValues(image.width, image.height);
            glMatrix.vec2.normalize(scale_values, scale_values);
            switch (scale_axis) {
                case "xy":
                    scale[0] = scale_values[0];
                    scale[1] = scale_values[1];
                    break;
                case "xz":
                    scale[0] = scale_values[0];
                    scale[2] = scale_values[1];
                    break;
                case "zy":
                    scale[2] = scale_values[0];
                    scale[1] = scale_values[1];
                    break;
                default:
                    break;
            }
            glMatrix.vec3.normalize(scale, scale);

            let err = gl.getError();
            if (err != 0) {
                gl.getError();
                throw new Error('Error generating mipmap: ' + err);
            }
            if (this.ext) {
                gl.texParameterf(gl.TEXTURE_2D, this.ext.TEXTURE_MAX_ANISOTROPY_EXT, 8);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            }
            else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            }
            gl.generateMipmap(gl.TEXTURE_2D);
                
            

            err = gl.getError();
            if(err != 0){
                gl.getError();
                throw new Error('Error setting texture parameters: ' + err);
            }

            console.log('loaded texture: ', image.src);

            _tex.loaded=true;

            gl.bindTexture(gl.TEXTURE_2D, null);
        });

        image.src = image_url;
    }

    bind(gl){
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
    }

    static xor_texture(width){
        let data = new Array(width * width * 4);
        for(let row = 0; row < width; row++){
            for(let col = 0; col < width; col++){
                let pix = (row * width + col) * 4;
                data[pix] = data[pix + 1] = data[pix + 2] = row ^ col;
                data[pix+3] = 255; 
            }
        }
    
        return new Uint8Array(data);
     }
}

