#!/bin/bash
# Kurzclip 2 aus Need-to-Know "New Race Class" (DE-Erzaehler): Klassenfrage zum neuen Volk. usage: build_sky2.sh SRC OUTDIR
SRC="$1"; OUT="$2"; F=/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf
ST=14.833; SRCDUR=12.54; D=13.93
mk() { local s="$1"
 local dt="fontfile=$F:fontcolor=white:borderw=4:bordercolor=black@0.85:shadowx=2:shadowy=2:x=(w-text_w)/2"
 ffmpeg -v error -y -ss $ST -t $SRCDUR -i "$SRC" -f lavfi -i "color=c=white:s=1080x12:r=30:d=$D" -filter_complex "
 [0:v]setpts=(PTS-STARTPTS)/0.9,fps=30,split[a][b];
 [a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=40,eq=brightness=-0.12[bg];
 [b]crop=1080:1080:420:0,scale=w='trunc(1080*(1+0.07*t/$D)/2)*2':h=-2:eval=frame:flags=lanczos,crop=1080:1080[fg];
 [bg][fg]overlay=0:480,
 drawtext=$dt:fontsize=56:fontcolor=0xFFD54A:text='$2':y=290:enable='between(t,0,2.9)',
 drawtext=$dt:fontsize=54:text='$3':y=395:enable='between(t,0,2.9)',
 drawtext=$dt:fontsize=58:fontcolor=0xFFD54A:text='Mit eigenen Optionen anpassen':y=290:enable='between(t,3.1,6.8)',
 drawtext=$dt:fontsize=58:fontcolor=0xFFD54A:text='Allianz Magier · Horde Schamane':y=290:enable='between(t,8.0,12.6)',
 drawtext=$dt:fontsize=70:fontcolor=0xFFD54A:text='$4':y=1160:enable='gte(t,$(echo "$D-4.2"|bc))'[v0];
 [v0][1:v]overlay=x='-w+w*t/$D':y=1560:shortest=1[v]" -map "[v]" -map 0:a -af "atempo=0.9,afade=t=in:st=0:d=0.05" -t $D -c:v libx264 -profile:v high -pix_fmt yuv420p -r 30 -crf 14 -preset slow -maxrate 16M -bufsize 32M -c:a aac -b:a 192k -movflags +faststart "$OUT/wow_volk2_$s.mp4"
}
mk tt "Allianz-Magier ODER Horde-Schamane?" "Das neue Volk in WoW Forever" "Magier oder Schamane?"
mk ig "Himmelsgeborene: Magier oder Schamane?" "Das neue Volk in WoW Forever" "Welche Klasse würdest du wählen?"
mk yt "Magier ODER Schamane?" "Himmelsgeborene in WoW Forever" "Welche Klasse spielst du?"
