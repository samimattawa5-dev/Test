#!/bin/bash
# Abendclip 24.11. Zonen & Dungeons (v5-Stil: Erzaehler, Hook-Frage, Open Loop). usage: build_zones.sh SRC OUTDIR
SRC="$1"; OUT="$2"; F=/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf
SRCDUR=25.9; D=28.8   # 25,9 s Quelle / 0,9 (Ende vor Logo-Karte)
mk() { # suffix hook1 hook2 endq
 local s="$1"
 local dt="fontfile=$F:fontcolor=white:borderw=4:bordercolor=black@0.85:shadowx=2:shadowy=2:x=(w-text_w)/2"
 ffmpeg -v error -y -t $SRCDUR -i "$SRC" -f lavfi -i "color=c=white:s=1080x12:r=30:d=$D" -filter_complex "
 [0:v]setpts=(PTS-STARTPTS)/0.9,fps=30,split[a][b];
 [a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=40,eq=brightness=-0.12[bg];
 [b]crop=1080:1080:420:0,scale=w='trunc(1080*(1+0.07*t/$D)/2)*2':h=-2:eval=frame:flags=lanczos,crop=1080:1080[fg];
 [bg][fg]overlay=0:480,
 drawtext=$dt:fontsize=66:fontcolor=0xFFD54A:text='$2':y=290:enable='between(t,0,4.4)',
 drawtext=$dt:fontsize=56:text='$3':y=395:enable='between(t,0,4.4)',
 drawtext=$dt:fontsize=70:fontcolor=0xFFD54A:text='Am Ende Dungeon-Beute':y=290:enable='between(t,4.6,6.5)',
 drawtext=$dt:fontsize=84:fontcolor=0xFFD54A:text='Neue Weltkarte':y=290:enable='between(t,6.7,8.7)',
 drawtext=$dt:fontsize=84:fontcolor=0xFFD54A:text='3 riesige neue Zonen':y=290:enable='between(t,8.9,11.2)',
 drawtext=$dt:fontsize=78:fontcolor=0xFFD54A:text='9 brandneue Dungeons':y=290:enable='between(t,13.3,17.2)',
 drawtext=$dt:fontsize=64:fontcolor=0xFFD54A:text='Von Lordaeron bis Sumpfland':y=290:enable='between(t,18.0,22.6)',
 drawtext=$dt:fontsize=60:fontcolor=0xFFD54A:text='Dungeonquests und neue Beute':y=290:enable='between(t,24.6,28.6)',
 drawtext=$dt:fontsize=74:fontcolor=0xFFD54A:text='$4':y=1160:enable='gte(t,24.6)'[v0];
 [v0][1:v]overlay=x='-w+w*t/$D':y=1560:shortest=1[v]" -map "[v]" -map 0:a -af "atempo=0.9" -t $D -c:v libx264 -profile:v high -pix_fmt yuv420p -r 30 -crf 14 -preset slow -maxrate 16M -bufsize 32M -c:a aac -b:a 192k -movflags +faststart "$OUT/wow_zones_$s.mp4"
}
mk tt "3 neue Zonen ODER 9 Dungeons?" "Das ist neu in WoW Forever" "Welche Zone zuerst?"
mk ig "Neue Zonen und Dungeons" "WoW Forever Überblick" "Welche Zone besuchst du zuerst?"
mk yt "Welche neue Zone zuerst?" "WoW Forever Zonen und Dungeons" "Zone oder Dungeon zuerst?"
