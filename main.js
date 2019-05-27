window.addEventListener("DOMContentLoaded", pageScript);

async function pageScript() {
    const input = document.querySelector('input[type="file"]');
    const files = new Set();

    input.addEventListener('change', e => {
        for(let file of input.files) {
            if(file.type.match('video')) {
                const fr = new FileReader();
                fr.onload = () => {
                    fileStatus.innerText = "Creating Movie Barcode..";

                    scan(fr.result).then(canvas => {
                        files.delete(file);
                        if(files.size == 0) {
                            fileStatus.innerText = "Done";
                        }
                        download(canvas, file);
                    });
                };
                files.add(file);
                fileStatus.innerText = "Loading file..";
                fr.readAsDataURL(file);
            }
        }
    });
}

function download(canvas, file) {
    const a = document.createElement('a');
    const name = file.name.split('.')[0];
    a.setAttribute("download", name + "-barcode.png");
    a.href = canvas.toDataURL('image/png');
    a.click();
}

async function scan(videoFile) {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        videos.appendChild(video);
        video.onloadedmetadata = async () => {
            createMovieBarcode(video).then(canvas => {
                resolve(canvas);
            })
        }
        video.muted = true;
        video.src = videoFile;
    })
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), ms);
    })
}

function getAverageColor(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const width = 1280;
    const height = 720;
    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(img, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    let r = 0, g = 0, b = 0;

    for (let i = 0, l = data.length; i < l; i += 4) {
        r += data[i];
        g += data[i+1];
        b += data[i+2];
    }

    r = Math.floor(r / (data.length / 4));
    g = Math.floor(g / (data.length / 4));
    b = Math.floor(b / (data.length / 4));

    return [r, g, b];
}

async function createMovieBarcode(video) {

    const fps = 30;

    let paused = false;
    video.onclick = () => {
        paused = !paused;
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const width = fps * video.duration;
    const height = width / 4;

    canvas.width = width;
    canvas.height = height;

    canvas.className = "movie-barcode";
    barcodes.appendChild(canvas);

    async function scanFrame(frame) {
        const color = getAverageColor(video);

        context.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        context.fillRect(frame, 0, 1, height);

        const preview = avrg.querySelector('canvas');
        const prev = preview.getContext('2d');
        prev.fillStyle = context.fillStyle;
        prev.fillRect(0, 0, 1, 1);
    }

    let frame = 0;
    let time = 0;

    return new Promise((resolve) => {
        const timestamp = Date.now();

        async function tick() {
            if(!paused) {
                video.currentTime = time;

                while(video.readyState !== 4 && !video.ended) 
                    await sleep(2);

                scanFrame(frame);
                
                time += (1000 / fps) / 1000;
                frame++;
            }
    
            if(time > video.duration) {
                console.log('finished in', ((Date.now() - timestamp) / 1000) + 's');
                resolve(canvas);
            } else {
                requestAnimationFrame(tick);
            }
        }
    
        tick();
    })
}
