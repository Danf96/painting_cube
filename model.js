class Model {
    meshes = [];
    materials = [];
    rotations = [];
    transform = glMatrix.mat4.create();
    constructor(gl, program, vertices, indices, uvs, normals, materials) {
        this.program = program;
        this.materials = materials;
        this.model_loc = gl.getUniformLocation(program, "model");
        for (let i = 0; i < 6; i++) {
            this.meshes.push(new Mesh(gl, program, vertices[i], indices, uvs[i], normals[i]));
        }
    }

    static box_quads(gl, program, width, height, depth, materials) {
        let hwidth = width / 2.0;
        let hheight = height / 2.0;
        let hdepth = depth / 2.0;
        let verts = [
            //top
            [
                hwidth, hheight, -hdepth,
                hwidth, hheight, hdepth,
                -hwidth, hheight, hdepth,
                -hwidth, hheight, -hdepth],
            //left
            [
                -hwidth, hheight, -hdepth,
                -hwidth, hheight, hdepth,
                -hwidth, -hheight, hdepth,
                -hwidth, -hheight, -hdepth],
            //front
            [
                hwidth, -hheight, -hdepth,
                hwidth, hheight, -hdepth,
                -hwidth, hheight, -hdepth,
                -hwidth, -hheight, -hdepth],
            //right
            [
                hwidth, -hheight, hdepth,   // bottom left
                hwidth, hheight, hdepth,    // top left
                hwidth, hheight, -hdepth,   // top right
                hwidth, -hheight, -hdepth], // bottom right
            //bottom
            [
                hwidth, -hheight, -hdepth, // top left
                hwidth, -hheight, hdepth,  // bottom left
                -hwidth, -hheight, hdepth, // bottom right
                -hwidth, -hheight, -hdepth], // top right
            //back
            [
                hwidth, -hheight, hdepth, // bottom right
                hwidth, hheight, hdepth, // top right
                -hwidth, hheight, hdepth, // top left
                -hwidth, -hheight, hdepth] // bottom left
        ];
        let uvs = [
            // top
            [
                1.0, 1.0,
                0.0, 1.0,
                0.0, 0.0,
                1.0, 0.0
            ],
            // left
            [
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0
            ],
            // front
            [
                0.0, 1.0,
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0
            ],
            // right
            [
                0.0, 1.0,
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0
            ],
            // bottom
            [
                1.0, 0.0,
                0.0, 0.0,
                0.0, 1.0,
                1.0, 1.0 
            ],
            // back
            [
                1.0, 1.0,
                1.0, 0.0,
                0.0, 0.0,
                0.0, 1.0
            ],
        ];
        let normals = [
            [
                0.0, 1.0, 0.0,
                0.0, 1.0, 0.0,
                0.0, 1.0, 0.0,
                0.0, 1.0, 0.0,
            ],
            [
                -1.0, 0.0, 0.0,
                -1.0, 0.0, 0.0,
                -1.0, 0.0, 0.0,
                -1.0, 0.0, 0.0,
            ],
            [
                0.0, 0.0, -1.0,
                0.0, 0.0, -1.0,
                0.0, 0.0, -1.0,
                0.0, 0.0, -1.0,
            ],
            [
                1.0, 0.0, 0.0,
                1.0, 0.0, 0.0,
                1.0, 0.0, 0.0,
                1.0, 0.0, 0.0,
            ],
            [
                0.0, -1.0, 0.0,
                0.0, -1.0, 0.0,
                0.0, -1.0, 0.0,
                0.0, -1.0, 0.0,
            ],
            [
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
            ]
        ];
        let indis = [
            // counter-clockwise winding
            0, 1, 2, 0, 2, 3
        ];
        return new Model(gl, program, verts, indis, uvs, normals, materials);
    }
    render(gl) {
        gl.uniformMatrix4fv(this.model_loc, false, this.transform);
        for (let i = 0; i < 6; i++) {
            this.meshes[i].render(gl, this.materials[i]);
        }
    }
}