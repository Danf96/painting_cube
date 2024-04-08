// make 6 quads with each having a material
class Mesh {
    constructor(gl, program, vertices, indices, uvs, normals) {
        this.tex_loc = gl.getUniformLocation( program, "texture0" );
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);
        let pos_id = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, pos_id );
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW );
        let pos_loc = gl.getAttribLocation( program, "v_pos" );
        gl.vertexAttribPointer(pos_loc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(pos_loc);
        
        let uv_id = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uv_id);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
        let uv_loc = gl.getAttribLocation( program, "v_texcoord" );
        gl.vertexAttribPointer(uv_loc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(uv_loc);

        let index_id = gl.createBuffer();
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, index_id );
        gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW );

        let normal_id = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normal_id);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
        let normal_loc = gl.getAttribLocation(program, "v_normal");
        gl.vertexAttribPointer(normal_loc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(normal_loc);

        this.n_verts = vertices.length;
        this.n_indis = indices.length;
        this.program = program;
        gl.bindVertexArray(null);
    }
    render(gl, material) {
        gl.bindVertexArray(this.vao);
        gl.uniform1i( this.tex_loc, 0 );
        gl.activeTexture(gl.TEXTURE0);
        material.bind(gl);
        gl.drawElements(gl.TRIANGLES, this.n_indis, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }
}

