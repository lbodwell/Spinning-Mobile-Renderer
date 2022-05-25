CS 4731 Project 4
Prof. Cuneo
Luke Bodwell

Application use:
    - General Instructions
        - Upload the sphere.ply file in order to render the scene
    - Controls
        - Press A to toggle shadows
        - Press B to toggle textures
        - Press C to toggle reflection
        - Press D to toggle refraction
        - Press M to switch to Gouraud shading
        - Press N to switch to flat shading
        - Press I to decrease the cone angle of the spotlight
        - Press P to increase the cone angle of the spotlight
        - Press E to enable experimental features (extra credit features that may not place nice with required features)
        - Press ↑ to move the spotlight up (experimental)
        - Press ↓ to move the spotlight down (experimental)
        - Press ← to move the spotlight Left (experimental)
        - Press → to move the spotlight right (experimental)
        - Click and drag the mouse to pan the camera (experimental)
        
Submitted files:
    - index.html: HTML markup of application including WebGL vertex and fragment shaders.
    - index.js: Main application script. Includes code for managing application state, handling input, uploading files, and rendering, transforming, lighting, and texturing the objects in the model.
    - css/main.css: Basic styling for the application including Bootstrap.
    - res/sphere.ply: Sphere model file. Must be uploaded to the application for it to run properly.
    - lib/*: Provided WebGL utility libraries.
    - README.txt: This file. Application documentation.

Extra credit features:
    - Ability to reposition spotlight
    - Ability to pan camera around scene