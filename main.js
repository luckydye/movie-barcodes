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

async function createMovieBarcode(video) {

    const fps = 30;

    let paused = false;
    video.onclick = () => {
        paused = !paused;
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const width = fps * video.duration;
    const height = 200;

    canvas.className = "movie-barcode";
    barcodes.appendChild(canvas);

    canvas.width = width;
    canvas.height = height;

    function getAvgColor(video) {
        const canvas = avrg.querySelector('canvas');
        canvas.width = 1;
        canvas.height = 1;
    
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, 1, 1);
    
        return ctx.getImageData(0, 0, 1, 1).data;
    }

    async function scanFrame(time, frame) {
        video.currentTime = time;

        while(video.readyState !== 4 && !video.ended) 
            await sleep(2);

        const color = getAvgColor(video);
        context.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        context.fillRect(frame, 0, 1, height);
    }

    let frame = 0;
    let time = 0;

    console.log(video.currentFrameTime);

    return new Promise((resolve) => {
        const timestamp = Date.now();

        async function tick() {
            if(!paused) {
                await scanFrame(time, frame);
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
