#!/bin/bash
# Klassen-Clip (echtes Gameplay, Class Highlight Series Part 1, kein Erzaehler). usage: build_class.sh SRC OUTDIR START DUR
SRC="$1"; OUT="$2"; ST="$3"; D="$4"; F=/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf
mk() { local s="$1"
 local dt="fontfile=$F:fontcolor=white:borderw=4:bordercolor=black@0.85:shadowx=2:shadowy=2:x=(w-text_w)/2"
 ffmpeg -v error -y -ss $ST -t $D -i "$SRC" -f lavfi -i "color=c=white:s=1080x12:r=30:d=$D" -filter_complex "
 [0:v]setpts=PTS-STARTPTS,fps=30,split[a][b];
 [a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=40,eq=brightness=-0.12[bg];
 [b]crop=1080:1080:420:0,scale=w='trunc(1080*(1+0.07*t/$D)/2)*2':h=-2:eval=frame:flags=lanczos,crop=1080:1080[fg];
 [bg][fg]overlay=0:480,
 drawtext=$dt:fontsize=56:fontcolor=0xFFD54A:text='$2':y=290:enable='between(t,0,3.6)',
 drawtext=$dt:fontsize=54:text='$3':y=395:enable='between(t,0,3.6)',
 drawtext=$dt:fontsize=66:fontcolor=0xFFD54A:text='$4':y=290:enable='between(t,8,11.5)',
 drawtext=$dt:fontsize=70:fontcolor=0xFFD54A:text='$5':y=1160:enable='gte(t,$(echo "$D-4.5"|bc))'[v0];
 [v0][1:v]overlay=x='-w+w*t/$D':y=1560:shortest=1[v]" -map "[v]" -map 0:a -af "afade=t=in:st=0:d=0.1,afade=t=out:st=$(echo "$D-0.8"|bc):d=0.8" -t $D -c:v libx264 -profile:v high -pix_fmt yuv420p -r 30 -crf 14 -preset slow -maxrate 16M -bufsize 32M -c:a aac -b:a 192k -movflags +faststart "$OUT/wow_klassen_$s.mp4"
}
mk tt "Krieger, Schurke oder Schamane?" "Welche Klasse spielst du?" "Krieger · Schurke · Schamane" "Welche Klasse spielst du?"
mk ig "Welche Klasse ist deine?" "WoW Forever Klassen" "Krieger · Schurke · Schamane" "Krieger, Schurke oder Schamane?"
mk yt "Krieger, Schurke oder Schamane?" "WoW Forever Klassen" "Welche Klasse wählst du?" "Welche Klasse spielst du?"
