#!/usr/bin/env python3
"""Kurzclip aus Need-to-Know (DE-Erzaehler, 90 %), v5-Rezept. usage:
make_ns.py SRC OUTDIR NAME START SRCDUR 'hook1|sub1' 'hook1|sub1' 'hook1|sub1' 'text@a-b;text@a-b' 'endfrage' (Hooks tt, ig, yt; Zeiten im fertigen Clip)"""
import subprocess,sys
SRC,OUT,NAME=sys.argv[1:4]; ST=float(sys.argv[4]); SD=float(sys.argv[5]); D=SD/0.9
hooks=sys.argv[6:9]; pops=sys.argv[9]; endq=sys.argv[10]
F="/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf"
dt=f"fontfile={F}:fontcolor=white:borderw=4:bordercolor=black@0.85:shadowx=2:shadowy=2:x=(w-text_w)/2"
esc=lambda x:x.replace("'","").replace(":","\\:")
for suf,h in zip(["tt","ig","yt"],hooks):
    h1,h2=h.split("|")
    ex=""
    for p in pops.split(";"):
        t,r=p.split("@"); a,b=r.split("-")
        ex+=f"drawtext={dt}:fontsize=58:fontcolor=0xFFD54A:text='{esc(t)}':y=290:enable='between(t,{a},{b})',"
    fc=(f"[0:v]setpts=(PTS-STARTPTS)/0.9,fps=30,split[a][b];"
        f"[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=40,eq=brightness=-0.12[bg];"
        f"[b]crop=1080:1080:420:0,scale=w='trunc(1080*(1+0.07*t/{D:.2f})/2)*2':h=-2:eval=frame:flags=lanczos,crop=1080:1080[fg];"
        f"[bg][fg]overlay=0:480,"
        f"drawtext={dt}:fontsize=58:fontcolor=0xFFD54A:text='{esc(h1)}':y=290:enable='between(t,0,3.2)',"
        f"drawtext={dt}:fontsize=54:text='{esc(h2)}':y=395:enable='between(t,0,3.2)',"
        f"{ex}"
        f"drawtext={dt}:fontsize=70:fontcolor=0xFFD54A:text='{esc(endq)}':y=1160:enable='gte(t,{D-3.6:.2f})'[v0];"
        f"[v0][1:v]overlay=x='-w+w*t/{D:.2f}':y=1560:shortest=1[v]")
    cmd=["ffmpeg","-v","error","-y","-ss",f"{ST}","-t",f"{SD}","-i",SRC,"-f","lavfi","-i",f"color=c=white:s=1080x12:r=30:d={D:.2f}",
         "-filter_complex",fc,"-map","[v]","-map","0:a","-af","atempo=0.9,afade=t=in:st=0:d=0.05","-t",f"{D:.2f}","-c:v","libx264","-profile:v","high","-pix_fmt","yuv420p","-r","30",
         "-crf","14","-preset","slow","-maxrate","16M","-bufsize","32M","-c:a","aac","-b:a","192k","-movflags","+faststart",f"{OUT}/wow_{NAME}_{suf}.mp4"]
    subprocess.run(cmd,check=True)
print("ok",NAME,round(D,2))
