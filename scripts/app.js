
const upload = document.getElementById('upload');
let originalImageData = null;
let originalExifData = null;
const canvas = document.getElementById('canvas');
const result = document.getElementById('result');
const downloadBtn = document.getElementById('downloadBtn');
const info = document.getElementById('info');

function toDecimal(coord, ref) {
  if (!Array.isArray(coord) || coord.length !== 3) return null;
  let degrees, minutes, seconds;
  // Format EXIF.js: array of objects {numerator, denominator}
  if (typeof coord[0] === 'object' && coord[0] !== null && 'numerator' in coord[0] && 'denominator' in coord[0]) {
    if (
      typeof coord[0].numerator === 'number' && typeof coord[0].denominator === 'number' && coord[0].denominator !== 0 &&
      typeof coord[1].numerator === 'number' && typeof coord[1].denominator === 'number' && coord[1].denominator !== 0 &&
      typeof coord[2].numerator === 'number' && typeof coord[2].denominator === 'number' && coord[2].denominator !== 0
    ) {
      degrees = coord[0].numerator / coord[0].denominator;
      minutes = coord[1].numerator / coord[1].denominator;
      seconds = coord[2].numerator / coord[2].denominator;
    } else {
      return null;
    }
  } else if (
    typeof coord[0] === 'number' && typeof coord[1] === 'number' && typeof coord[2] === 'number'
  ) {
    // Format array angka: [deg, min, sec]
    degrees = coord[0];
    minutes = coord[1];
    seconds = coord[2];
  } else {
    return null;
  }
  let decimal = degrees + minutes / 60 + seconds / 3600;
  if (ref === "S" || ref === "W") decimal *= -1;
  return decimal;
}

async function getLocation(lat, lon) {
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
  const data = await response.json();
  return data.display_name || "Location not available";
}

function renderAll(img, exifData) {
  // Ambil pengaturan watermark
  const watermarkColor = document.getElementById('watermarkColor')?.value || '#ffff00';
  const watermarkSize = parseInt(document.getElementById('watermarkSize')?.value, 10) || 22;
  const watermarkPosition = document.getElementById('watermarkPosition')?.value || 'bottom-right';
  // Ambil pengaturan teks
  const fontColor = document.getElementById('fontColor')?.value || '#ffff00';
  const fontSize = parseInt(document.getElementById('fontSize')?.value, 10) || 28;
  const fontFamily = document.getElementById('fontFamily')?.value || 'Arial';
  const textPosition = document.getElementById('textPosition')?.value || 'bottom';
  const textAlign = document.getElementById('textAlign')?.value || 'left';

  const date = exifData.date;
  const lat = exifData.lat;
  const lon = exifData.lon;
  const latRef = exifData.latRef;
  const lonRef = exifData.lonRef;
  const locationText = exifData.locationText;

  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = fontColor;
  ctx.textBaseline = 'top';

  // Siapkan semua teks yang akan ditampilkan
  let latlonText = "Latitude: tidak tersedia, Longitude: tidak tersedia";
  if (lat && lon && latRef && lonRef) {
    const latitude = toDecimal(lat, latRef);
    const longitude = toDecimal(lon, lonRef);
    if (typeof latitude === 'number' && !isNaN(latitude) && typeof longitude === 'number' && !isNaN(longitude)) {
      latlonText = `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`;
    } else {
      latlonText = "Latitude: tidak tersedia, Longitude: tidak tersedia";
    }
  }
  const lines = [latlonText, date, locationText];

  // Hitung posisi Y awal berdasarkan pilihan user
  const padding = 20;
  const lineHeight = fontSize * 1.3;
  let y;
  if (textPosition === 'top') {
    y = padding;
  } else if (textPosition === 'middle') {
    y = (img.height - (lines.length * lineHeight)) / 2;
  } else { // bottom
    y = img.height - (lines.length * lineHeight) - Math.round(padding * 2.5);
  }

  // Batasi lebar teks hingga setengah gambar
  const maxWidth = img.width / 2;

  // Fungsi untuk membungkus teks ke baris baru jika tidak muat, dan mengatur posisi horizontal
  function wrapTextLinesAlign(ctx, text, y, maxWidth, lineHeight, align) {
    const words = text.split(' ');
    let line = '';
    let linesArr = [];
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        linesArr.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    linesArr.push(line);
    for (let i = 0; i < linesArr.length; i++) {
      let drawX = padding;
      const lineWidth = ctx.measureText(linesArr[i]).width;
      if (align === 'center') {
        drawX = (img.width - lineWidth) / 2;
      } else if (align === 'right') {
        drawX = img.width - lineWidth - padding;
      }
      ctx.fillText(linesArr[i], drawX, y);
      y += lineHeight;
    }
    return y;
  }

  // Gambar semua teks dengan wrap dan align
  let currentY = y;
  for (let i = 0; i < lines.length; i++) {
    currentY = wrapTextLinesAlign(ctx, lines[i], currentY, maxWidth, lineHeight, textAlign);
  }

  // Watermark: teks atau logo, sesuai pengaturan user
  function getWatermarkXY(imgW, imgH, wmW, wmH, pos, pad) {
    let x = 0, y = pad;
    if (pos === 'bottom-right') {
      x = imgW - wmW;
      y = imgH - wmH - pad;
    } else if (pos === 'bottom-left') {
      x = 0;
      y = imgH - wmH - pad;
    } else if (pos === 'top-right') {
      x = imgW - wmW;
      y = pad;
    } // top-left default
    return {x, y};
  }
  const logoInput = document.getElementById('watermarkLogo');
  const logoFile = logoInput && logoInput.files && logoInput.files[0];
  if (logoFile) {
    const logoImg = new window.Image();
    const logoReader = new FileReader();
    logoReader.onload = function(ev) {
      logoImg.onload = function() {
        ctx.save();
        ctx.globalAlpha = 1.0;
        let maxLogoWidth = img.width * 0.2;
        if (watermarkSize > 10) maxLogoWidth = img.width * (watermarkSize / 100);
        let logoW = logoImg.width;
        let logoH = logoImg.height;
        if (logoW > maxLogoWidth) {
          logoH = logoH * (maxLogoWidth / logoW);
          logoW = maxLogoWidth;
        }
        const pos = getWatermarkXY(img.width, img.height, logoW, logoH, watermarkPosition, padding);
        ctx.drawImage(logoImg, pos.x, pos.y, logoW, logoH);
        ctx.restore();
        try {
          const dataURL = canvas.toDataURL("image/jpeg");
          result.src = dataURL;
          downloadBtn.href = dataURL;
          downloadBtn.style.display = "inline-block";
        } catch (err) {
          result.src = originalImageData || '';
          downloadBtn.style.display = "none";
          info.innerHTML += '<br><span style="color:red">Gagal menampilkan hasil foto. Ukuran foto terlalu besar untuk diproses browser.</span>';
        }
      };
      logoImg.src = ev.target.result;
    };
    logoReader.readAsDataURL(logoFile);
  } else {
    // Watermark teks jika tidak ada logo
    const watermarkText = '© Balai Wilayah Sungai Sumatera VI';
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.font = `${watermarkSize}px ${fontFamily}`;
    ctx.fillStyle = watermarkColor;
    const wmMetrics = ctx.measureText(watermarkText);
    let wmW = wmMetrics.width;
    let wmH = watermarkSize;
    const pos = getWatermarkXY(img.width, img.height, wmW, wmH, watermarkPosition, padding);
    ctx.fillText(watermarkText, pos.x, pos.y);
    ctx.restore();
    try {
      const dataURL = canvas.toDataURL("image/jpeg");
      result.src = dataURL;
      downloadBtn.href = dataURL;
      downloadBtn.style.display = "inline-block";
    } catch (err) {
      result.src = originalImageData || '';
      downloadBtn.style.display = "none";
      info.innerHTML += '<br><span style="color:red">Gagal menampilkan hasil foto. Ukuran foto terlalu besar untuk diproses browser.</span>';
    }
  }
}

upload.addEventListener('change', async function () {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    let exifProcessed = false;
    img.onload = async function () {
      let exifTimeout = setTimeout(function() {
        if (!exifProcessed) {
          info.innerHTML = '<span style="color:red;font-weight:bold">Gagal membaca metadata EXIF. Browser Anda kemungkinan membatasi akses metadata (khususnya di perangkat mobile). Silakan coba di browser/PC lain.</span>';
          result.src = e.target.result;
          downloadBtn.style.display = "none";
        }
      }, 2000); // 2 detik timeout
      try {
        EXIF.getData(img, async function () {
          exifProcessed = true;
          clearTimeout(exifTimeout);
          const date = EXIF.getTag(this, "DateTimeOriginal") || null;
          const lat = EXIF.getTag(this, "GPSLatitude");
          const lon = EXIF.getTag(this, "GPSLongitude");
          const latRef = EXIF.getTag(this, "GPSLatitudeRef");
          const lonRef = EXIF.getTag(this, "GPSLongitudeRef");
          // Cek metadata minimal: tanggal dan GPS
          if (
            date == null ||
            lat == null || !Array.isArray(lat) || lat.length !== 3 ||
            lon == null || !Array.isArray(lon) || lon.length !== 3 ||
            latRef == null || lonRef == null
          ) {
            info.innerHTML = '<span style="color:red;font-weight:bold">Foto dokumentasi kegiatan anda tidak memiliki metadata sehingga tidak dapat diproses</span>' +
              '<br><span style="color:#555;font-size:0.95em">[Debug EXIF]<br>' +
              'DateTimeOriginal: ' + (date ? JSON.stringify(date) : '<i>null</i>') + '<br>' +
              'GPSLatitude: ' + (lat ? JSON.stringify(lat) : '<i>null</i>') + ' <br><b>typeof:</b> ' + (typeof lat) + '<br>' +
              'GPSLongitude: ' + (lon ? JSON.stringify(lon) : '<i>null</i>') + ' <br><b>typeof:</b> ' + (typeof lon) + '<br>' +
              'GPSLatitudeRef: ' + (latRef ? JSON.stringify(latRef) : '<i>null</i>') + ' <br><b>typeof:</b> ' + (typeof latRef) + '<br>' +
              'GPSLongitudeRef: ' + (lonRef ? JSON.stringify(lonRef) : '<i>null</i>') + ' <br><b>typeof:</b> ' + (typeof lonRef) +
              '</span>';
            result.src = e.target.result;
            downloadBtn.style.display = "none";
            return;
          }
          let locationText = "Location not available";
          let latitudeText = "Latitude: tidak tersedia";
          let longitudeText = "Longitude: tidak tersedia";
          if (lat && lon && latRef && lonRef) {
            const latitude = toDecimal(lat, latRef);
            const longitude = toDecimal(lon, lonRef);
            locationText = await getLocation(latitude, longitude);
            latitudeText = `Latitude: ${latitude.toFixed(6)}`;
            longitudeText = `Longitude: ${longitude.toFixed(6)}`;
          }
          info.innerHTML = `
            <strong>Timestamp:</strong> ${date}<br>
            <strong>${latitudeText}</strong><br>
            <strong>${longitudeText}</strong>
          `;
          originalImageData = e.target.result;
          originalExifData = { date, lat, lon, latRef, lonRef, locationText };
          renderAll(img, originalExifData);
        });
      } catch (err) {
        clearTimeout(exifTimeout);
        info.innerHTML = '<span style="color:red;font-weight:bold">Terjadi error saat membaca metadata EXIF: ' + err.message + '</span>';
        result.src = e.target.result;
        downloadBtn.style.display = "none";
      }
    };
    img.onerror = function() {
      info.innerHTML = '<span style="color:red;font-weight:bold">Gagal memuat gambar. Format file tidak didukung atau file rusak.</span>';
      downloadBtn.style.display = "none";
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

// Render ulang gambar jika pengaturan teks/watermark berubah
['fontColor','fontSize','fontFamily','textPosition','textAlign','watermarkColor','watermarkSize','watermarkPosition','watermarkLogo'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    // Untuk slider fontSize dan watermarkSize, gunakan event 'input' agar update real-time
    if (id === 'fontSize' || id === 'watermarkSize') {
      el.addEventListener('input', function() {
        if (!originalImageData || !originalExifData) return;
        const img = new window.Image();
        img.onload = function() {
          renderAll(img, originalExifData);
        };
        img.src = originalImageData;
      });
    }
    el.addEventListener('change', function() {
      if (!originalImageData || !originalExifData) return;
      const img = new window.Image();
      img.onload = function() {
        renderAll(img, originalExifData);
      };
      img.src = originalImageData;
    });
  }
});
