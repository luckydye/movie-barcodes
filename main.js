window.addEventListener("DOMContentLoaded", pageScript);

async function pageScript() {
    const input = document.querySelector('input[type="file"]');
    const files = new Set();

    input.addEventListener('change', e => {
        for(let file of input.files) {
            const fr = new FileReader();
            fr.onload = () => {
                fileStatus.innerText = "Creating Movie Barcode..";

                scan(file, fr.result).then(() => {
                    files.delete(file);
                    if(files.size == 0) {
                        fileStatus.innerText = "Done";
                    }
                });
            };
            files.add(file);
            fileStatus.innerText = "Loading file..";
            fr.readAsDataURL(file);
        }
    });
}

function download(canvas, file) {
    const a = document.createElement('a');
    a.setAttribute("download", file.name + "-barcode");
    a.href = canvas.toDataURL();
    a.click();
}

async function scan(file, videoFile) {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        videos.appendChild(video);
        video.onloadedmetadata = async () => {
            createMovieBarcode(video).then((canvas) => {
                download(canvas, file);
                resolve(canvas);
            })
        }
        video.muted = true;
        video.src = videoFile;
    })
}

async function createMovieBarcode(video) {
    const canvas = document.createElement('canvas');
    canvas.className = "movie-barcode";
    barcodes.appendChild(canvas);

    const context = canvas.getContext('2d');

    const width = video.duration;
    const height = 150;

    canvas.width = width;
    canvas.height = height;
    
    for(let i = 0; i < video.duration; i++) {
        video.currentTime = i;

        while(video.readyState !== 4 && !video.ended) await sleep(2);

        const color = getAvgColor(video);
        context.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        context.fillRect(i, 0, 1, height);
    }

    function getAvgColor(video) {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
    
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, 1, 1);
    
        return ctx.getImageData(0, 0, 1, 1).data;
    }

    return canvas;
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), ms);
    })
}
