#!/bin/bash
# Kurzclip 18:30 (26.11.): Klasse-Volk-Kombi aus Need-to-Know General Features (DE-Erzaehler, 90 %). usage: build_kombi.sh SRC OUTDIR
SRC="$1"; OUT="$2"; F=/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf
ST=12.2; SRCDUR=10.03; D=11.15
mk() { local s="$1"
 local dt="fontfile=$F:fontcolor=white:borderw=4:bordercolor=black@0.85:shadowx=2:shadowy=2:x=(w-text_w)/2"
 ffmpeg -v error -y -ss $ST -t $SRCDUR -i "$SRC" -f lavfi -i "color=c=white:s=1080x12:r=30:d=$D" -filter_complex "
 [0:v]setpts=(PTS-STARTPTS)/0.9,fps=30,split[a][b];
 [a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=40,eq=brightness=-0.12[bg];
 [b]crop=1080:1080:420:0,scale=w='trunc(1080*(1+0.07*t/$D)/2)*2':h=-2:eval=frame:flags=lanczos,crop=1080:1080[fg];
 [bg][fg]overlay=0:480,
 drawtext=$dt:fontsize=58:fontcolor=0xFFD54A:text='$2':y=290:enable='between(t,0,3.2)',
 drawtext=$dt:fontsize=54:text='$3':y=395:enable='between(t,0,3.2)',
 drawtext=$dt:fontsize=62:fontcolor=0xFFD54A:text='Neue Klasse-Volk-Kombi':y=290:enable='between(t,3.5,7.2)',
 drawtext=$dt:fontsize=70:fontcolor=0xFFD54A:text='$4':y=1160:enable='gte(t,7.0)'[v0];
 [v0][1:v]overlay=x='-w+w*t/$D':y=1560:shortest=1[v]" -map "[v]" -map 0:a -af "atempo=0.9,afade=t=in:st=0:d=0.05" -t $D -c:v libx264 -profile:v high -pix_fmt yuv420p -r 30 -crf 14 -preset slow -maxrate 16M -bufsize 32M -c:a aac -b:a 192k -movflags +faststart "$OUT/wow_kombi_$s.mp4"
}
mk tt "Welche Klasse + welches Volk?" "Neu in WoW Forever" "Deine Kombi?"
mk ig "Klasse und Volk: Welche Kombi?" "WoW Forever" "Welche Kombi spielst du?"
mk yt "Welche Kombi aus Klasse und Volk?" "WoW Forever" "Welche Kombi spielst du?"
