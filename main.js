//import { mat2, mat2d, mat3, mat4, quat, quat2, vec2, vec3, vec4, glMatrix } from "./index.js";
let canvas = document.getElementById('cube-canvas');
/** @type {WebGLRenderingContext}*/
let gl = canvas.getContext('webgl2');
let vertex_source =
    `#version 300 es
            precision mediump float;

            uniform mat4 projection;
            uniform mat4 view;
            uniform mat4 model;

            in vec3 v_pos;
            in vec2 v_texcoord;
            in vec3 v_normal;

            out vec2 f_texcoord;
            out vec3 f_normal;
            out vec3 f_pos;

            void main( void ) {
                gl_Position = projection * view * model * vec4( v_pos, 1.0 );
                vec4 v_pos4 = view * model * vec4(v_pos, 1.0);
                f_pos = vec3(v_pos4) / v_pos4.w;
                f_texcoord = v_texcoord;
                f_normal = mat3(transpose(inverse(model))) * v_normal;
            }
        `;

let fragment_source =
    `#version 300 es
            precision mediump float;

            in vec2 f_texcoord;
            in vec3 f_normal;
            in vec3 f_pos;

            out vec4 f_color;

            uniform sampler2D texture0;

            vec3 attenuate(float intensity, float distance){
                const float const_k = 1.0;
                const float lin_l = 0.09;
                const float quad_q = 0.032;
                float atten = intensity/(const_k + lin_l + (distance * distance) * quad_q * pow(distance,2.0));
                return vec3(atten);
            }
            
            void main( void ) {
                const vec3 camera_pos = vec3(0.0, 0.0, 1.25);
                const vec3 light_pos = vec3(0.0, 0.0, 1.5);
                const vec3 light_color = vec3(1.0);
                vec3 normal = normalize(f_normal);
                vec3 light_dir = (light_pos - f_pos);
                float distance = length(light_dir);
                light_dir = normalize(light_dir);
                vec3 attenuation = attenuate(1.15, distance);
                float diff = max(dot(light_dir, normal), 0.0);
                vec3 diffuse = diff * light_color;
                vec3 view_dir = normalize(camera_pos - f_pos);
                vec3 reflect_dir = reflect(-light_dir, normal);
                float spec = 0.0;
                vec3 halfway_dir = normalize (light_dir + view_dir);
                spec = pow(max(dot(normal, halfway_dir), 0.0), 16.0);
                vec3 specular = spec * light_color;
                vec3 lighting = attenuation * (diffuse + specular) * texture(texture0, f_texcoord).rgb;
                f_color = vec4(lighting, 1.0);
            }
        `;


gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

gl.enable( gl.DEPTH_TEST );
gl.enable( gl.BLEND );

gl.depthMask( true );
gl.depthFunc( gl.LEQUAL );

gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );

const fovy = glMatrix.glMatrix.toRadian(45.0);
var aspect_r = (canvas.width / canvas.height);
const d_near = 0.1;
const d_far = 5.0;
let shader_program = create_compile_and_link_program(gl, vertex_source, fragment_source);

const DESIRED_TICK_RATE = 60;
const DESIRED_MSPT = 1000.0 / DESIRED_TICK_RATE;
const UPDATE_DT = 1.0 / 60.0;

const ext = (
    gl.getExtension('EXT_texture_filter_anisotropic') ||
    gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
    gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic')
);
let cubemats = [];
let blend_mode = null;
let cube_transforms = [];
let transform_angles = [[90.0, 0.0, 270.0], [0.0, 90.0, 0.0], [0.0, 180.0, 0.0], [0.0, 270.0, 0.0], [270.0, 0.0, 90.0], [0.0, 0.0, 0.0]];
let scale_axes = ["xz", "zy", "xy", "zy", "xz", "xy"];

for (let i = 1; i <= 6; i++) {
    let  q = glMatrix.quat.create();
    let angle = transform_angles[i - 1];
    let scale = glMatrix.vec3.fromValues(1.0, 1.0, 1.0);
    glMatrix.quat.fromEuler(q, angle[0], angle[1], angle[2], "zyx");
    cubemats.push(new Material(gl, 'tex/painting0' + i + '.png', ext, scale, scale_axes[i - 1]));
    cube_transforms.push({rotation: q, scale: scale});
}

const cube = Model.box_quads(gl, shader_program, 1, 1, 1, cubemats);

var projection = glMatrix.mat4.create();
glMatrix.mat4.perspectiveNO(projection, fovy, aspect_r, d_near, d_far);
const proj_loc = gl.getUniformLocation(shader_program, "projection");
const view = glMatrix.mat4.create();
glMatrix.mat4.lookAt(view, [0.0, 0.0, 1.25], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);
const view_loc = gl.getUniformLocation(shader_program, "view");

function render(now) {
    requestAnimationFrame(render);
    if (resizeCanvasToDisplaySize(canvas) === true) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        aspect_r = canvas.width / canvas.height;
        glMatrix.mat4.perspectiveNO(projection, fovy, aspect_r, d_near, d_far);
    }
    last_update = now;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(shader_program);
    gl.uniformMatrix4fv(proj_loc, false, projection);
    gl.uniformMatrix4fv(view_loc, false, view)
    cube.render(gl);
    gl.useProgram(null);

}
let accumulator = 0.0;
let rotation_state = 0;
let source_side = 0;
let target_side = 0;
let new_transform = glMatrix.mat4.create();
let new_scaling = glMatrix.mat4.create();
let new_quat = glMatrix.quat.create();
function update() {
    if (rotation_state === 0) {
        do {
            target_side = Math.floor(Math.random() * 6);
        } while (target_side === source_side);
        rotation_state = 1;
    } 
    else if (rotation_state === 1) {
        accumulator += UPDATE_DT;
        glMatrix.quat.identity(new_quat);
        glMatrix.mat4.identity(new_transform);
        glMatrix.mat4.identity(new_scaling);
        if (accumulator < 1.0) {
            glMatrix.quat.lerp(new_quat, cube_transforms[source_side].rotation, cube_transforms[target_side].rotation, accumulator);
            glMatrix.quat.normalize(new_quat, new_quat);
            let scaling_vec = glMatrix.vec3.create();
            glMatrix.vec3.lerp(scaling_vec, cube_transforms[source_side].scale, cube_transforms[target_side].scale, accumulator);
            glMatrix.vec3.normalize(scaling_vec, scaling_vec);
            glMatrix.mat4.fromQuat(new_transform, new_quat);
            glMatrix.mat4.fromScaling(new_scaling, scaling_vec);
        }
        else {
            rotation_state = 2;
            accumulator = 0.0;
            glMatrix.mat4.fromQuat(new_transform, cube_transforms[target_side].rotation);
            glMatrix.mat4.fromScaling(new_scaling, cube_transforms[target_side].scale);
        }
        glMatrix.mat4.multiply(new_transform, new_transform, new_scaling);
        cube.transform = new_transform;  
    }
    else {
        accumulator += UPDATE_DT;
        if (accumulator >= 1.0) {
            rotation_state = 0;
            source_side = target_side;
            accumulator = 0.0;
        }
    }
    return;
}

function resizeCanvasToDisplaySize(canvas) {
    const display_width = canvas.clientWidth;
    const display_height = canvas.clientHeight;
    const need_resize = canvas.width !== display_width ||
                        canvas.height !== display_height;
    if (need_resize) {
        canvas.width = display_width;
        canvas.height = display_height;
    }
    return need_resize;
}

let last_update = performance.now();
setInterval(update, DESIRED_MSPT);
requestAnimationFrame(render);

function create_compile_and_link_program( gl, v_shader_src, f_shader_src ) {
    let program = gl.createProgram()
    
    let v_shader = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource( v_shader, v_shader_src );
    gl.compileShader( v_shader );
    assert_shader_compiled_correctly( gl, v_shader );

    let f_shader = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource( f_shader, f_shader_src );
    gl.compileShader( f_shader );
    assert_shader_compiled_correctly( gl, f_shader );

    gl.attachShader( program, v_shader );
    gl.attachShader( program, f_shader );
    gl.linkProgram( program );

    if( !gl.getProgramParameter( program, gl.LINK_STATUS ) ) {
        let err = gl.getProgramInfoLog( program );
        throw new Error( 'Link error in shader program:\n' + err );
    }

    return program;
}

function assert_shader_compiled_correctly( gl, shader_id ) {
    if( !gl.getShaderParameter( shader_id, gl.COMPILE_STATUS ) ) {
        let err = gl.getShaderInfoLog( shader_id );
        let shader_kind = gl.getShaderParameter( shader_id, gl.SHADER_TYPE );
        let shader_kind_name = 
            shader_kind == gl.VERTEX_SHADER ? 'vertex shader' :
            shader_kind == gl.FRAGMENT_SHADER ? 'fragment shader' :
            'unknown shader'; 

        throw new Error( 'Compile error in ' + shader_kind_name + ':\n' + err );
    }

    return true;
}