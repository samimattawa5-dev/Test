#!/bin/bash
# Baut Mulgore-Zonenflug (nativ 9:16) je Plattform. usage: build_mulgore.sh SRC OUTDIR
SRC="$1"; OUT="$2"; F=/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf
ST=4.15; DUR=24.55
mk() { # suffix hook1 hook2 mid1 mid2 end1
 local s="$1"; local dt="fontfile=$F:fontcolor=white:borderw=4:bordercolor=black@0.85:shadowx=2:shadowy=2:x=(w-text_w)/2"
 ffmpeg -v error -y -ss $ST -t $DUR -i "$SRC" -f lavfi -i "color=c=white:s=1080x12:r=30:d=$DUR" -filter_complex "
 [0:v]setpts=PTS-STARTPTS,scale=w='trunc(1080*(1+0.06*t/$DUR)/2)*2':h=-2:eval=frame:flags=lanczos,crop=1080:1920:(iw-1080)/2:(ih-1920)/2,
 drawtext=$dt:fontsize=88:fontcolor=0xFFD54A:text='$2':y=300:enable='between(t,0,4.2)',
 drawtext=$dt:fontsize=58:text='$3':y=420:enable='between(t,0.8,4.2)',
 drawtext=$dt:fontsize=84:fontcolor=0xFFD54A:text='$4':y=300:enable='between(t,9.3,12.8)',
 drawtext=$dt:fontsize=84:fontcolor=0xFFD54A:text='$5':y=300:enable='between(t,14.4,17.6)',
 drawtext=$dt:fontsize=74:fontcolor=0xFFD54A:text='$6':y=1160:enable='gte(t,19.8)'[v0];
 [v0][1:v]overlay=x='-w+w*t/$DUR':y=1560:shortest=1[v]" -map "[v]" -map 0:a -af "afade=t=out:st=$(echo "$DUR-0.6"|bc):d=0.6" -c:v libx264 -profile:v high -pix_fmt yuv420p -r 30 -crf 14 -preset slow -maxrate 16M -bufsize 32M -c:a aac -b:a 192k -movflags +faststart "$OUT/wow_mulgore_$s.mp4"
}
mk tt "Dein erster Char?" "Taurenkrieger in Mulgore" "Erinnerst du dich noch?" "Dein erstes Mount?" "Wo startete DEINE Reise?"
mk ig "Zurück zum Anfang" "Mulgore in WoW Forever" "Die Heimat der Tauren" "So sah dein Start aus" "Wo hat deine Reise begonnen?"
mk yt "Kennst du diese Zone noch?" "Mulgore in WoW Forever" "Der Start der Tauren" "Hier begann jedes Abenteuer" "Welche Zone war dein Start?"
