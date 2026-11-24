#!/usr/bin/env python3
"""Kurzclip aus Deep Dive: Schnittpunkte an Sprechpausen, v5-Rezept (Blur-BG, Mitte 1080x1080, Zoom, Balken, atempo 0.9).
usage: make_short.py SRC OUTDIR NAME START END 'hookTT|subTT' 'hookIG|subIG' 'hookYT|subYT' 'popup@rel0-rel1;...' 'endfrage'
rel = Sekunden im fertigen Clip"""
import subprocess,sys,re
SRC,OUT,NAME=sys.argv[1:4]; S,E=float(sys.argv[4]),float(sys.argv[5])
hooks=sys.argv[6:9]; pops=sys.argv[9]; endq=sys.argv[10]
F="/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf"
def snap(t,mode):
    r=subprocess.run(["ffmpeg","-v","info","-ss",str(t-2),"-t","4","-i",SRC,"-vn","-af","silencedetect=n=-32dB:d=0.18","-f","null","-"],capture_output=True,text=True).stderr
    st=[float(x)+t-2 for x in re.findall(r"silence_start: ([\d.]+)",r)]
    en=[float(x)+t-2 for x in re.findall(r"silence_end: ([\d.]+)",r)]
    if mode=="in" and en: return min(en,key=lambda x:abs(x-t))-0.05
    if mode=="out" and st: return min(st,key=lambda x:abs(x-t))+0.1
    return t
s=snap(S,"in"); e=snap(E,"out"); dur=e-s; D=dur/0.9
print("cut",round(s,2),round(e,2),"src",round(dur,2),"out",round(D,2))
dt=f"fontfile={F}:fontcolor=white:borderw=4:bordercolor=black@0.85:shadowx=2:shadowy=2:x=(w-text_w)/2"
def esc(x): return x.replace("'","").replace(":","\\:")
for suf,h in zip(["tt","ig","yt"],hooks):
    h1,h2=h.split("|")
    ex=""
    for p in pops.split(";"):
        txt,rng=p.split("@"); a,b=rng.split("-")
        ex+=f"drawtext={dt}:fontsize=60:fontcolor=0xFFD54A:text='{esc(txt)}':y=290:enable='between(t,{a},{b})',"
    fc=(f"[0:v]setpts=(PTS-STARTPTS)/0.9,fps=30,split[a][b];"
        f"[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=40,eq=brightness=-0.12[bg];"
        f"[b]crop=1080:1080:420:0,scale=w='trunc(1080*(1+0.07*t/{D:.2f})/2)*2':h=-2:eval=frame:flags=lanczos,crop=1080:1080[fg];"
        f"[bg][fg]overlay=0:480,"
        f"drawtext={dt}:fontsize=66:fontcolor=0xFFD54A:text='{esc(h1)}':y=290:enable='between(t,0,3.6)',"
        f"drawtext={dt}:fontsize=54:text='{esc(h2)}':y=395:enable='between(t,0,3.6)',"
        f"{ex}"
        f"drawtext={dt}:fontsize=70:fontcolor=0xFFD54A:text='{esc(endq)}':y=1160:enable='gte(t,{D-4.2:.2f})'[v0];"
        f"[v0][1:v]overlay=x='-w+w*t/{D:.2f}':y=1560:shortest=1[v]")
    cmd=["ffmpeg","-v","error","-y","-ss",f"{s:.3f}","-t",f"{dur:.3f}","-i",SRC,"-f","lavfi","-i",f"color=c=white:s=1080x12:r=30:d={D:.2f}",
         "-filter_complex",fc,"-map","[v]","-map","0:a","-af","atempo=0.9,afade=t=in:st=0:d=0.05","-t",f"{D:.2f}","-c:v","libx264","-profile:v","high","-pix_fmt","yuv420p","-r","30",
         "-crf","14","-preset","slow","-maxrate","16M","-bufsize","32M","-c:a","aac","-b:a","192k","-movflags","+faststart",f"{OUT}/wow_{NAME}_{suf}.mp4"]
    subprocess.run(cmd,check=True)
print("ok",NAME)
