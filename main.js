function pageScript() {

    const file = document.querySelector('input[type="file"]');
    file.addEventListener('change', e => {
        for(let f of file.files) {
            const fr = new FileReader();
            fr.onload = () => {
                scan(fr.result);
            };
            fr.readAsDataURL(f);
        }
    });
}

async function scan(videoFile) {
    const video = document.createElement('video');
    document.body.appendChild(video);

    video.onloadedmetadata = async () => {
        video.muted = true;
        const canvas = await createMovieBarcode(video);
        download(canvas);
    }

    video.src = videoFile;
}

async function createMovieBarcode(video) {
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);

    const context = canvas.getContext('2d');

    const width = video.duration;
    const height = 180;

    canvas.width = width;
    canvas.height = height;
    
    for(let i = 0; i < video.duration; i++) {
        video.currentTime = i;

        while(video.readyState !== 4) {
            await sleep(2);
        }

        const color = getAvgColor(video);
        context.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        context.fillRect(i, 0, 1, height);
    }

    return canvas;
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms)
    })
}

function getAvgColor(video) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, 1, 1);

    return ctx.getImageData(0, 0, 1, 1).data;
}

function download(canvas) {
    const a = document.createElement('a');
    a.setAttribute('download', "srtip");
    a.href = canvas.toDataURL();
    a.click();
}

window.addEventListener("DOMContentLoaded", pageScript);
