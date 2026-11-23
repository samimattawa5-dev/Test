#!/bin/bash
# Abendclip 23.11. (General Features, Erzaehler, Auswahlfrage, Open Loop). usage: build_features.sh SRC OUTDIR
SRC="$1"; OUT="$2"; F=/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf
SRCDUR=26.3; D=29.2   # 26,3 s Quelle / 0,9
mk() { # suffix hook1 hook2 loop
 local s="$1"
 local dt="fontfile=$F:fontcolor=white:borderw=4:bordercolor=black@0.85:shadowx=2:shadowy=2:x=(w-text_w)/2"
 ffmpeg -v error -y -t $SRCDUR -i "$SRC" -f lavfi -i "color=c=white:s=1080x12:r=30:d=$D" -filter_complex "
 [0:v]setpts=(PTS-STARTPTS)/0.9,fps=30,split[a][b];
 [a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=40,eq=brightness=-0.12[bg];
 [b]crop=1080:1080:420:0,scale=w='trunc(1080*(1+0.07*t/$D)/2)*2':h=-2:eval=frame:flags=lanczos,crop=1080:1080[fg];
 [bg][fg]overlay=0:480,
 drawtext=$dt:fontsize=66:fontcolor=0xFFD54A:text='$2':y=290:enable='between(t,0,4.4)',
 drawtext=$dt:fontsize=56:text='$3':y=395:enable='between(t,0,4.4)',
 drawtext=$dt:fontsize=70:fontcolor=0xFFD54A:text='$4':y=290:enable='between(t,4.8,8)',
 drawtext=$dt:fontsize=84:fontcolor=0xFFD54A:text='Neue Weltkarte':y=290:enable='between(t,9.8,11.8)',
 drawtext=$dt:fontsize=84:fontcolor=0xFFD54A:text='Neue Insel Zephras':y=290:enable='between(t,12.0,13.8)',
 drawtext=$dt:fontsize=76:fontcolor=0xFFD54A:text='Neue Klasse-Volk-Kombis':y=290:enable='between(t,17.4,21.4)',
 drawtext=$dt:fontsize=74:fontcolor=0xFFD54A:text='Was freut dich am meisten?':y=1160:enable='gte(t,23.5)'[v0];
 [v0][1:v]overlay=x='-w+w*t/$D':y=1560:shortest=1[v]" -map "[v]" -map 0:a -af "atempo=0.9" -t $D -c:v libx264 -profile:v high -pix_fmt yuv420p -r 30 -crf 14 -preset slow -maxrate 16M -bufsize 32M -c:a aac -b:a 192k -movflags +faststart "$OUT/wow_features_$s.mp4"
}
mk tt "Dungeons ODER neue Kombis?" "Das ist neu in WoW Forever" "Warte auf die neuen Kombis"
mk ig "Das ist alles neu" "WoW Forever in 30 Sekunden" "Gleich kommen die neuen Kombis"
mk yt "Kennst du schon alles Neue?" "WoW Forever Features" "Gleich die neuen Kombis"
