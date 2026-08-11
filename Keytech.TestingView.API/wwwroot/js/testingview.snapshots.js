L.viewSnapshots = function (event, position) {
    if ($(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId}`).hasClass("selected")) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    }

    if (!position.positionSnapshots || position.positionSnapshots.length === 0) {
        return;
    }

    var preloadedImages = [];

    position.positionSnapshots.forEach((snapshot) => { 
        var img = new Image();
        img.src = `${L.snapshotUrlPrefix}${snapshot.snapshotUrl}`;
        preloadedImages.push(img);
    });

    let currentIndex = 0;
    let currentUrl = `${L.snapshotUrlPrefix}${position.positionSnapshots[currentIndex].snapshotUrl}`;

    const updateSnapshot = function () {
        currentUrl = `${L.snapshotUrlPrefix}${position.positionSnapshots[currentIndex].snapshotUrl}`;
        if (position.positionSnapshots.length === 0) {
            $(`.${L.s(4, -5) /* snapshot-viewer */}`).remove();
        } else {
            $(`.${L.s(4, -6) /* snapshot-viewer-image-container */} img`).attr("src", `${currentUrl}`);
        }
        $(`.${L.s(4, -7) /* snapshot-viewer-counter */}`).text(`${currentIndex + 1} / ${position.positionSnapshots.length}`);
        $(`.${L.s(4, -8) /* snapshot-viewer-info */} .${L.s(4, -9) /* snapshot-viewer-url */}`).text(currentUrl);
        $(`#${L.r.s(7, -3) /* ID_ */}${position.positionId}.${L.r.s(7, -2) /* V_POSITION */}`).find(`.${L.s(5, -2) /* view-snapshots-button */}`).attr(L.s(5, -3) /* data-snapshots */, position.positionSnapshots.length);
        $(`#${L.r.s(7, -3) /* ID_ */}${position.positionId}.${L.r.s(7, -2) /* V_POSITION */}`).find(`.${L.s(5, -2) /* view-snapshots-button */}`).attr("title", L.s(5, -4, position.positionSnapshots.length > 1 ? position.positionSnapshots.length + " " : "", position.positionSnapshots.length > 1 ? "s" : "") /* View {0}snapshot{1} */);
    }

    const viewer = $(`
        <div class="${L.s(4, -5) /* snapshot-viewer */}">
            <button class="${L.s(5, -5) /* snapshot-viewer-button */} ${L.s(5, -6) /* snapshot-viewer-close-button */} lightButton secondary xsmall typography-regular14px" title="${L.s(-3, 1) /* Close */}">
                ${L.s(5, -7) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path stroke="currentColor" stroke-width="1.2" d="m1.5 1.5 15 15m0-15-15 15"></path></svg> */}
            </button>
            <div class="${L.s(4, -7) /* snapshot-viewer-counter */}">${currentIndex + 1} / ${position.positionSnapshots.length}</div>
            <button class="${L.s(5, -5) /* snapshot-viewer-button */} ${L.s(5, -8) /* snapshot-viewer-delete-button */} lightButton secondary xsmall typography-regular14px" title="${L.s(8, 0) /* Delete */}">
                ${L.s(5, -9) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path fill="currentColor" d="M12 4h3v1h-1.04l-.88 9.64a1.5 1.5 0 0 1-1.5 1.36H6.42a1.5 1.5 0 0 1-1.5-1.36L4.05 5H3V4h3v-.5C6 2.67 6.67 2 7.5 2h3c.83 0 1.5.67 1.5 1.5V4ZM7.5 3a.5.5 0 0 0-.5.5V4h4v-.5a.5.5 0 0 0-.5-.5h-3ZM5.05 5l.87 9.55a.5.5 0 0 0 .5.45h5.17a.5.5 0 0 0 .5-.45L12.94 5h-7.9Z"></path></svg> */}
            </button>
            <div class="${L.s(6, -1) /* snapshot-viewer-image-container */}">
                <img src="${currentUrl}" alt="${L.s(6, -2) /* Snapshot */}" />
            </div>
            <button class="${L.s(5, -5) /* snapshot-viewer-button */} ${L.s(6, -3) /* snapshot-viewer-nav-button */} ${L.s(6, -4) /* snapshot-viewer-prev */} lightButton secondary xsmall typography-regular14px" title="${L.s(6, -7) /* Previous */}">
                ${L.s(6, -5) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none"><path stroke="currentColor" stroke-linecap="round" stroke-width="1.2" d="M17 22.5 6.85 12.35a.5.5 0 0 1 0-.7L17 1.5"></path></svg> */}
            </button>
            <div class="${L.s(4, -8) /* snapshot-viewer-info */}">
                <span class="${L.s(4, -9) /* snapshot-viewer-url */}" contenteditable>${currentUrl}</span>
                <button class="${L.s(5, -5) /* snapshot-viewer-button */} ${L.s(6, -6) /* snapshot-viewer-copy-url */} lightButton secondary xsmall typography-regular14px" title="${L.s(6, -8) /* Copy chart link */}">
                    ${L.s(6, -9) /* <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><g fill="none" fill-rule="evenodd" stroke="currentColor"><path d="M13.111 18.5H10.5a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-8.389z"></path><path d="M18.5 20v1.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1H8"></path></g></svg> */}
                </button>
            </div>
            <button class="${L.s(5, -5) /* snapshot-viewer-button */} ${L.s(6, -3) /* snapshot-viewer-nav-button */} ${L.s(7, -2) /* snapshot-viewer-next */} lightButton secondary xsmall typography-regular14px" title="Next">
                ${L.s(7, -3) /* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none"><g transform="scale(-1,1) translate(-24,0)"><path stroke="currentColor" stroke-linecap="round" stroke-width="1.2" d="M17 22.5 6.85 12.35a.5.5 0 0 1 0-.7L17 1.5"></path></g></svg> */}
            </button>
        </div>
    `);

    viewer.on("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        viewer.find(`.${L.s(5, -6) /* snapshot-viewer-close-button */}`).click();
    });

    viewer.find(`.${L.s(5, -6) /* snapshot-viewer-close-button */}`).on("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        viewer.remove();
        $(document).off(`keydown.${L.s(4, -5) /* snapshot-viewer */}`); // Remove keydown listener when viewer is closed
    });

    viewer.find(`.${L.s(5, -8) /* snapshot-viewer-delete-button */}`).on("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        position.positionSnapshots.splice(currentIndex, 1);
        L.dataOps.setPositionSnapshots(position.positionId, position.positionSnapshots);

        if (position.positionSnapshots.length === 0) {
            viewer.remove();
            $(document).off(`keydown.${L.s(4, -5) /* snapshot-viewer */}`); // Remove keydown listener when viewer is closed
        } else {
            currentIndex = Math.min(currentIndex, position.positionSnapshots.length - 1);
        }

        updateSnapshot();
    });

    viewer.find(`.${L.s(6, -4) /* snapshot-viewer-prev */}`).on("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (currentIndex > 0) {
            currentIndex--;
        } else {
            currentIndex = position.positionSnapshots.length - 1; // Cycle to the last snapshot
        }
        updateSnapshot();
    });

    viewer.find(`.${L.s(7, -2) /* snapshot-viewer-next */}`).on("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (currentIndex < position.positionSnapshots.length - 1) {
            currentIndex++;
        } else {
            currentIndex = 0; // Cycle to the first snapshot
        }
        updateSnapshot();
    });

    viewer.find(`.${L.s(4, -9) /* snapshot-viewer-url */}`).on("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    });

    // Copy URL button logic
    viewer.find(`.${L.s(6, -6) /* snapshot-viewer-copy-url */}`).on('click', async function(event){
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        try {
            const text = viewer.find(`.${L.s(4, -9) /* snapshot-viewer-url */}`).text().trim();
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback using temporary textarea
                const ta = document.createElement('textarea');
                ta.value = text; document.body.appendChild(ta); ta.select();
                document.execCommand('copy'); document.body.removeChild(ta);
            }
            const btn = $(this);
            const originalTitle = btn.attr('title');
            btn.attr('title', L.s(7, -4) /* Copied! */);
            btn.addClass('copied');
            setTimeout(()=>{ btn.attr('title', originalTitle); btn.removeClass('copied'); }, 1200);
        } catch(_e) {
            L.messageBox(L.s(7, -5) /* Copy failed */, L.s(7, -6) /* Could not copy snapshot URL to clipboard. */);
        }
    });

    // Add keydown listener for left/right arrow keys
    $(document).on(`keydown.${L.s(4, -5) /* snapshot-viewer */}`, function (e) {
        if (e.key === L.s(7, -7) /* ArrowLeft */) {
            viewer.find(`.${L.s(6, -4) /* snapshot-viewer-prev */}`).click();
        } else if (e.key === L.s(7, -8) /* ArrowRight */) {
            viewer.find(`.${L.s(7, -2) /* snapshot-viewer-next */}`).click();
        } else if (e.key === L.s(7, -9) /* Escape */) {
            viewer.find(`.${L.s(5, -6) /* snapshot-viewer-close-button */}`).click();
        } else if (e.key === L.s(8, -1) /* Delete */) {
            viewer.find(`.${L.s(5, -8) /* snapshot-viewer-delete-button */}`).click();
        }
    });

    $("body").append(viewer);
}

L.brandSnapshots = function () {
    const cwc = L.t._chartWidgetCollection;

    cwc._originalImages = cwc._originalImages || cwc.images.bind(cwc);
    cwc._processedImages = cwc._processedImages || function (e) {
        const result = cwc._originalImages(e);
        
        var formattedSessionDate = (L._mockDate || $(`#${L.s(0, 9) /* TestingViewCurrentDate */}`).text() || $(L.s(5, -1) /* button[data-name='time-zone-menu'] */).text()).replace(/\s{2,}/g, " ").trim();
        const publishedBy = [L.s(3, -6, L.user?.tradingViewUsername || user.username, formattedSessionDate, L.c().getTimezone()) /* [TestingView.com] [{0}] Snapshot on {1} {2} */];

        result.publishedBy = publishedBy;
        return result;
    };
    cwc.images = cwc._processedImages;
    return cwc;
}

L.takeSnapshot = async function (position, snapshotsPerChart, copyImageToClipboard, onProgress, sendToGpt) {
    var takeSnapshotButton = $(`#${L.r.s(7, -3) /* ID_ */}${position?.positionId}.${L.r.s(7, -2) /* V_POSITION */}`).find(`.${L.r.s(6, -8) /* take-snapshot-button */}`);
    var takeSnapshotLoader = $(`#${L.r.s(7, -3) /* ID_ */}${position?.positionId}.${L.r.s(7, -2) /* V_POSITION */}`).find(`.${L.r.s(6, -9) /* take-snapshot-loader */}`);
    takeSnapshotButton.hide();
    takeSnapshotLoader.show();
    var cwc = L.brandSnapshots();

    await new Promise(function (resolve, reject) { 
        setTimeout(async () => { 
            try {
                var snapshotUrls = [];

                if(snapshotsPerChart) {
                    await L.applyOnChartsAsync(async (c, i) => {
                        if(c.timeframeText != 42) {
                            cwc.images = function (e) {
                                const result = cwc._processedImages(e);
                                result.publishedBy = [...result.publishedBy, L.s(7, 6, c.timeframeText) /* Timeframe: {0} */];
                                result.charts = [c.chartWidget().images(e)];
                                return result;
                            };

                            if(copyImageToClipboard || sendToGpt) {
                                const imageCanvas = await cwc.clientSnapshot()
                                const snapshotBlob = await new Promise((resolve) => imageCanvas.toBlob(resolve, 'image/png'));

                                if(copyImageToClipboard) {
                                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': snapshotBlob })]);
                                }

                                if(sendToGpt) {
                                    // Convert blob to base64 and send to API
                                    const base64 = await L.blobToBase64(snapshotBlob);
                                    await L.sendImageToGpt(base64, L.c().symbol(), `snapshot_${c.timeframeText}_${Date.now()}.png`);
                                }

                                if(onProgress) {
                                    await onProgress(c, i);
                                }
                            } else {
                                const snapshotUrl = await cwc.takeScreenshot();
                                snapshotUrls.push(snapshotUrl);
                            }

                            cwc = L.brandSnapshots();
                        }
                    }, sendToGpt);
                } else {
                    if(copyImageToClipboard || sendToGpt) {
                        const imageCanvas = await L.t.takeClientScreenshot()
                        const snapshotBlob = await new Promise((resolve) => imageCanvas.toBlob(resolve, 'image/png'));

                        if(copyImageToClipboard) {
                            await navigator.clipboard.write([new ClipboardItem({ 'image/png': snapshotBlob })]);
                        }
                        
                        if(sendToGpt) {
                            // Convert blob to base64 and send to API
                            const base64 = await L.blobToBase64(snapshotBlob);
                            await L.sendImageToGpt(base64, L.c().symbol(), `snapshot_${Date.now()}.png`);
                        }
                    } else {
                        snapshotUrls.push(await L.t.takeScreenshot());
                    }
                }

                if(position) {
                    for(const snapshotUrl of snapshotUrls) {
                        position.positionSnapshots.push({ snapshotUrl, sessionTime: L.session.currentDate });
                    }

                    var viewSnapshostButton = $(`#${L.r.s(7, -3) /* ID_ */}${position.positionId}.${L.r.s(7, -2) /* V_POSITION */}`).find(`.${L.s(5, -2) /* view-snapshots-button */}`);
                    viewSnapshostButton.attr(L.s(5, -3) /* data-snapshots */, position.positionSnapshots.length);
                    viewSnapshostButton.attr("title", L.s(5, -4, position.positionSnapshots.length > 1 ? position.positionSnapshots.length + " " : "", position.positionSnapshots.length > 1 ? "s" : "") /* View {0}snapshot{1} */);
                    
                    L.dataOps.setPositionSnapshots(position.positionId, position.positionSnapshots);
                    setTimeout(() => {
                        takeSnapshotButton.show();
                        takeSnapshotLoader.hide();
                    }, 300);
                }

                if(snapshotUrls.length) {
                    const snapshotUrlsCombined = snapshotUrls.map(snapshotUrl => `${L.snapshotUrlPrefix}${snapshotUrl}`).join("\n");
                    await L.tryExecAsync(() => navigator.clipboard.writeText(snapshotUrlsCombined), true);
                }

                resolve();
            } catch (e) {
                L.brandSnapshots();
                L.toast(L.s(7, -1, e.message) /* Error taking snapshots: {0} */);
                reject(e);
            }
        }, 10);
    });
}

L.onTakeSnapshot = async function (event, position) {
    if ($(`tr#${L.r.s(7, -3) /* ID_ */}${position.positionId}`).hasClass("selected")) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    }

    if(L.t.chartsCount() > 1) {
        if(L.session.meta.snapshotsPerChart === undefined || event.ctrlKey) {
            await L.confirmBox(L.s(7, 1) /* Taking snapshots */, L.s(7, 5) /* Do you want to take separate snapshots of each chart? */, async (ok) => {
                L.session.meta.snapshotsPerChart = ok;
                await L.takeSnapshot(position, L.session.meta.snapshotsPerChart);
            });
        } else {
            await L.takeSnapshot(position, L.session.meta.snapshotsPerChart);
        }
    } else {
        await L.takeSnapshot(position, false);
    }
}

// Convert a Blob to base64 string (without data URL prefix)
L.blobToBase64 = function(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function() {
            // Remove the data URL prefix (e.g., "data:image/png;base64,")
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

// Send image to GPT analysis API
L.sendImageToGpt = async function(base64, symbol, fileName, mimeType = 'image/png') {
    try {
        const response = await fetch(L.s(4, 8, "gpt/analyze-image") /* https://api.testingview.com/{0} */, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'user': user.username,
            },
            body: JSON.stringify({
                symbol: symbol,
                imageBase64: base64,
                fileName: fileName,
                mimeType: mimeType
            })
        });

        if (response.ok) {
            const result = await response.json();
            L.dbg('Image sent to GPT queue:', "info", result);
            L.toast(L.s(7, 7) /* Image sent to ChatGPT */ || 'Image sent to ChatGPT');
            return true;
        } else {
            L.dbg('Failed to send image to GPT:', "error", response.status);
            L.toast(L.s(7, 8) /* Failed to send image */ || 'Failed to send image');
            return false;
        }
    } catch (error) {
        L.dbg('Error sending image to GPT:', "error", error);
        L.toast(L.s(7, 8) /* Failed to send image */ || 'Failed to send image');
        return false;
    }
};