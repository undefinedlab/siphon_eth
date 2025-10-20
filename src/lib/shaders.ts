export const simulationVertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const simulationFragmentShader = `
uniform sampler2D textureA;
uniform vec2 mouse;
uniform vec2 resolution;
uniform float time;
uniform int frame;
varying vec2 vUv;

const float delta = 1.4;  

void main() {
    vec2 uv = vUv;
    if (frame == 0) {
        gl_FragColor = vec4(0.0);
        return;
    }
    
    vec4 data = texture2D(textureA, uv);
    float pressure = data.x;
    float pVel = data.y;
    
    vec2 texelSize = 1.0 / resolution;
    float p_right = texture2D(textureA, uv + vec2(texelSize.x, 0.0)).x;
    float p_left = texture2D(textureA, uv + vec2(-texelSize.x, 0.0)).x;
    float p_up = texture2D(textureA, uv + vec2(0.0, texelSize.y)).x;
    float p_down = texture2D(textureA, uv + vec2(0.0, -texelSize.y)).x;
    
    if (uv.x <= texelSize.x) p_left = p_right;
    if (uv.x >= 1.0 - texelSize.x) p_right = p_left;
    if (uv.y <= texelSize.y) p_down = p_up;
    if (uv.y >= 1.0 - texelSize.y) p_up = p_down;
    
    // Enhanced wave equation matching ShaderToy
    pVel += delta * (-2.0 * pressure + p_right + p_left) / 4.0;
    pVel += delta * (-2.0 * pressure + p_up + p_down) / 4.0;
    
    pressure += delta * pVel;
    
    pVel -= 0.005 * delta * pressure;
    
    pVel *= 1.0 - 0.002 * delta;
    pressure *= 0.999;
    
    vec2 mouseUV = mouse / resolution;
    if(mouse.x > 0.0) {
        float dist = distance(uv, mouseUV);
        if(dist <= 0.02) {  // Smaller radius for more precise ripples
            pressure += 2.0 * (1.0 - dist / 0.02);  // Increased intensity
        }
    }
    
    gl_FragColor = vec4(pressure, pVel, 
        (p_right - p_left) / 2.0, 
        (p_up - p_down) / 2.0);
}
`;

export const renderVertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const renderFragmentShader = `
uniform sampler2D textureA;
uniform sampler2D textureB;
uniform vec2 resolution;
uniform float time;
varying vec2 vUv;

// Noise function for organic patterns
float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Fractal noise for organic burns
float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 4; i++) {
        value += amplitude * noise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    return value;
}

void main() {
    vec4 data = texture2D(textureA, vUv);
    
    // Much smaller pixelation effect
    float pixelSize = 0.8 + sin(time * 3.0) * 0.4;
    vec2 pixelatedUV = floor(vUv * resolution / pixelSize) * pixelSize / resolution;
    
    vec2 distortion = 0.3 * data.zw;
    vec4 color = texture2D(textureB, pixelatedUV + distortion);
    
    // Create organic burn patterns underneath water
    vec2 burnUV = vUv * 8.0 + time * 0.1;
    float burnPattern = fbm(burnUV);
    burnPattern += fbm(burnUV * 2.0 + time * 0.2) * 0.5;
    burnPattern += fbm(burnUV * 4.0 + time * 0.3) * 0.25;
    
    // Create chemical burn effect
    float burnIntensity = burnPattern * 0.3;
    burnIntensity += sin(vUv.x * 20.0 + time) * 0.1;
    burnIntensity += sin(vUv.y * 15.0 + time * 1.2) * 0.1;
    
    // Apply thermal vision heatmap to burn patterns (underneath)
    vec3 thermalBurnColor;
    if (burnIntensity > 0.8) {
        // Bright white-yellow core
        thermalBurnColor = vec3(1.0, 1.0, 0.8);
    } else if (burnIntensity > 0.6) {
        // Bright yellow
        thermalBurnColor = vec3(1.0, 1.0, 0.3);
    } else if (burnIntensity > 0.4) {
        // Orange
        thermalBurnColor = vec3(1.0, 0.6, 0.1);
    } else if (burnIntensity > 0.2) {
        // Red-orange
        thermalBurnColor = vec3(1.0, 0.3, 0.0);
    } else if (burnIntensity > 0.1) {
        // Dark red
        thermalBurnColor = vec3(0.8, 0.1, 0.0);
    } else {
        // Dark blue background
        thermalBurnColor = vec3(0.1, 0.1, 0.3);
    }
    
    // Add thermal glow to burns
    float burnGlow = burnIntensity * burnIntensity * 2.0;
    thermalBurnColor += vec3(burnGlow * 0.3);
    
    // Get text intensity for water transparency
    float textIntensity = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    
    // Create water effect over thermal burns
    // Water is more transparent where text is darker (allows thermal burns to show through)
    float waterOpacity = textIntensity * 0.8 + 0.2; // Minimum 20% opacity for water
    
    // Mix thermal burns (underneath) with water distortion (on top)
    vec3 finalColor = mix(thermalBurnColor, color.rgb, waterOpacity);
    
    // Add pixel noise
    vec2 noiseUV = floor(vUv * resolution / pixelSize) * pixelSize / resolution;
    float noise = fract(sin(dot(noiseUV, vec2(12.9898, 78.233))) * 43758.5453);
    noise = step(0.98, noise) * 0.2;
    finalColor += vec3(noise * 0.5);
    
    gl_FragColor = vec4(finalColor, 1.0);
}
`;


