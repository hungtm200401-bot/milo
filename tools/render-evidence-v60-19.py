from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import textwrap

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'reports-v60-19'/'evidence'
OUT.mkdir(parents=True,exist_ok=True)
FONT='/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf'

F={}
def font(size):
    if size not in F:
        F[size]=ImageFont.truetype(FONT,size)
    return F[size]

def rr(d,box,r,fill,outline=None,w=1): d.rounded_rectangle(box,radius=r,fill=fill,outline=outline,width=w)
def txt(d,xy,t,size=16,fill='#17395d',anchor=None): d.text(xy,t,font=font(size),fill=fill,anchor=anchor)
def wrap(d,xy,t,width,size=16,fill='#49657a',spacing=5):
    lines=textwrap.wrap(t,width=width)
    d.multiline_text(xy,'\n'.join(lines),font=font(size),fill=fill,spacing=spacing)
    return len(lines)

def base(title,unit='LỚP 2 · UNIT 1',step=1,now='Bấm nghe để Milo giải thích bài học.'):
    im=Image.new('RGB',(1440,900),'#edf6fb'); d=ImageDraw.Draw(im)
    # top
    rr(d,(24,18,1416,78),18,'#ffffff','#d8e7f2'); txt(d,(48,38),'←  HÀNH TRÌNH',14,'#1977ad'); txt(d,(720,47),unit,16,'#17395d','mm'); txt(d,(1385,47),'Tiến độ 35%',14,'#4e788e','rm')
    # left nav
    rr(d,(24,94,280,870),22,'#ffffff','#d8e7f2'); txt(d,(48,120),'HÀNH TRÌNH UNIT',12,'#1882c1');
    items=['Từ mới','Phát âm','Mẫu câu','Nghe','Nói','Đọc','Viết','Kiểm tra']
    for i,it in enumerate(items):
        y=154+i*68; active=(it.lower() in title.lower()) or (i==0 and 'Vocabulary' in title)
        rr(d,(40,y,264,y+54),13,'#e8f6ff' if active else '#f8fbfd','#a8d8f2' if active else None)
        txt(d,(55,y+18),f'{i+1}',13,'#168bd0'); txt(d,(82,y+17),it,15,'#17395d')
    # right compact
    rr(d,(1180,94,1416,420),22,'#ffffff','#d8e7f2'); rr(d,(1235,118,1360,243),28,'#e8f6ff'); txt(d,(1297,180),'MILO',22,'#168bd0','mm');
    txt(d,(1205,268),'Milo đồng hành',14,'#17395d'); wrap(d,(1205,294),'Mình chỉ hiện một việc để con dễ làm.',25,12); rr(d,(1205,350,1390,396),12,'#f2efff'); txt(d,(1298,373),'Hỏi Milo',14,'#6545b0','mm')
    # center header
    rr(d,(300,94,1160,180),20,'#ffffff','#d8e7f2'); txt(d,(326,112),unit,11,'#1882c1'); txt(d,(326,136),title,24,'#17395d'); txt(d,(1128,136),'Milo hướng dẫn: BẬT',12,'#177baa','rm')
    # steps
    steps=['Giảng','Ví dụ','Làm cùng','Tự làm','Chữa','Kiểm tra','Xong']
    for i,s in enumerate(steps):
        x=300+i*122; fill='#168fd1' if i+1==step else '#dff5e7' if i+1<step else '#f7fafc'; col='#fff' if i+1==step else '#347a57' if i+1<step else '#8193a0'
        rr(d,(x,194,x+112,244),12,fill,'#d4e3ec'); txt(d,(x+56,213),str(i+1),12,col,'mm'); txt(d,(x+56,232),s,11,col,'mm')
    # now
    rr(d,(300,258,1160,322),17,'#176d9f'); txt(d,(326,274),'VIỆC CON CẦN LÀM BÂY GIỜ',11,'#ccecff'); txt(d,(326,296),now,17,'#ffffff')
    return im,d

def footer(d,label='Kiểm tra đáp án'):
    rr(d,(470,814,990,868),15,'#6650d7'); txt(d,(730,841),label,17,'#ffffff','mm'); txt(d,(730,887),'Bản dựng từ dữ liệu và layout V60.19 · không phải ảnh chụp EXE',11,'#6b8192','ms')

def vocabulary():
    im,d=base('Vocabulary 1 · Từ mới',step=2,now='Xem tối đa năm từ, nghe mẫu rồi nói lại.')
    words=[('math','/mæθ/','môn Toán','I have math today.'),('art','/ɑːrt/','môn Mỹ thuật','I have art today.'),('science','/ˈsaɪəns/','môn Khoa học','I have science today.')]
    y=344
    for i,(w,ipa,vi,ex) in enumerate(words):
        rr(d,(320,y+i*140,1140,y+122+i*140),18,'#fbfdff','#d7e6ef'); rr(d,(340,y+20+i*140,415,y+95+i*140),18,'#e8f6ff'); txt(d,(378,y+57+i*140),str(i+1),24,'#168bd0','mm'); txt(d,(438,y+18+i*140),w,22); txt(d,(438,y+51+i*140),ipa,15,'#6545b0'); txt(d,(610,y+22+i*140),vi,16,'#397056'); txt(d,(438,y+80+i*140),ex,15,'#4d687b');
        for j,l in enumerate(['Nghe','Chậm','Nói lại']): rr(d,(870+j*82,y+72+i*140,944+j*82,y+105+i*140),9,'#f3f9fc','#c4dce9'); txt(d,(907+j*82,y+89+i*140),l,11,'#1478b5','mm')
    footer(d,'Con đã xem xong'); return im

def grammar():
    im,d=base('Grammar 1 · Mẫu câu',step=4,now='Chọn câu trả lời đúng cho câu hỏi.')
    rr(d,(324,344,1136,442),18,'#eef8ff'); txt(d,(350,362),'ĐỀ BÀI',11,'#e26f25'); txt(d,(350,388),'What do you do on school days?',22); txt(d,(350,420),'Con đọc câu hỏi rồi chọn câu trả lời phù hợp.',14,'#4f6a7d')
    rr(d,(324,458,1136,518),14,'#f5f9fc'); txt(d,(346,474),'VÍ DỤ',11,'#1882c1'); txt(d,(346,496),'I study and practise music on school days.',16)
    opts=['I study and practise music on school days.','Where is the library?','It is windy today.','A crocodile lives near rivers.']
    for i,o in enumerate(opts):
        x=324+(i%2)*405; y=538+(i//2)*72; rr(d,(x,y,x+388,y+56),13,'#e8f6ff' if i==0 else '#ffffff','#168bd0' if i==0 else '#cbdde8'); txt(d,(x+18,y+18),o,13,'#17395d')
    footer(d); return im

def listening():
    im,d=base('Listening · Nghe hiểu',step=4,now='Nghe lần hai rồi chọn từ được nhắc tới.')
    rr(d,(324,344,1136,430),18,'#edf8ff'); txt(d,(350,362),'BỐI CẢNH',11,'#1882c1'); txt(d,(350,388),'Một bạn nhỏ kể về ngày đi học.',18); txt(d,(350,414),'Từ khóa: school · music · math · practise',14,'#4d687b')
    rr(d,(324,446,650,504),14,'#168fd1'); txt(d,(487,475),'▶ Nghe lần 1',15,'#fff','mm'); rr(d,(668,446,994,504),14,'#f3f9fc','#bcd8e8'); txt(d,(831,475),'🐢 Nghe lần 2',15,'#1478b5','mm')
    rr(d,(324,526,1136,620),18,'#ffffff','#d8e6ef'); txt(d,(350,546),'ĐỀ BÀI',11,'#e26f25'); txt(d,(350,572),'Từ nào được nhắc trong đoạn nghe?',21); txt(d,(350,604),'Con nghe lại rồi bấm vào một từ.',14,'#4f6a7d')
    for i,o in enumerate(['music','museum','bridge','weather']): rr(d,(324+i*203,642,510+i*203,696),12,'#fff','#cbdde8'); txt(d,(417+i*203,669),o,14,'#17395d','mm')
    rr(d,(324,718,1136,766),12,'#f1f4f6'); txt(d,(350,742),'🔒 Transcript mở sau khi con trả lời.',14,'#6b7e89','lm'); footer(d); return im

def reading():
    im,d=base('Reading 1 · Đọc hiểu',step=4,now='Đọc đoạn 1 và chọn câu làm bằng chứng.')
    rr(d,(324,344,1136,510),18,'#fbfdff','#d8e6ef'); txt(d,(350,362),'ĐOẠN 1',11,'#1882c1'); txt(d,(1080,378),'🔊 Nghe đoạn',12,'#1478b5','rm'); wrap(d,(350,392),'Milo studies math and science on school days. He practises music after class. He likes learning new things with his friends.',75,17,'#344f65',8)
    rr(d,(324,528,1136,614),18,'#fff8e8','#eed9a6'); txt(d,(350,548),'ĐỀ BÀI',11,'#e26f25'); txt(d,(350,575),'Câu nào cho biết Milo luyện nhạc?',20)
    opts=['He practises music after class.','He lives near a river.','The weather is windy.']
    for i,o in enumerate(opts): rr(d,(324,634+i*54,1136,678+i*54),11,'#e8f6ff' if i==0 else '#fff','#168bd0' if i==0 else '#cbdde8'); txt(d,(350,649+i*54),o,14)
    footer(d); return im

def speaking():
    im,d=base('Speaking · Hội thoại',step=4,now='Hoàn thành vòng 2: thay một từ trong câu.')
    rr(d,(324,344,720,470),18,'#eef8ff'); txt(d,(350,362),'MILO HỎI',11,'#1882c1'); wrap(d,(350,390),'How do I get to the museum?',30,20); txt(d,(350,440),'Tôi đi đến bảo tàng bằng đường nào?',13,'#4f6a7d')
    rr(d,(740,344,1136,470),18,'#f3efff'); txt(d,(766,362),'CON TRẢ LỜI',11,'#6545b0'); wrap(d,(766,390),'Cross the square, then turn left.',31,18); txt(d,(766,440),'Băng qua quảng trường, rồi rẽ trái.',13,'#4f6a7d')
    rounds=[('1','Nói theo','Đã xong'),('2','Thay một từ','Đang làm'),('3','Tự trả lời','Chưa mở')]
    for i,(n,l,s) in enumerate(rounds):
        x=324+i*270; rr(d,(x,500,x+250,574),14,'#e8f6ff' if i==1 else '#f8fbfd','#168bd0' if i==1 else '#d6e4ed'); txt(d,(x+28,524),n,16,'#168bd0'); txt(d,(x+58,519),l,14); txt(d,(x+58,545),s,11,'#6b8191')
    rr(d,(324,596,1136,700),18,'#fff','#d8e6ef'); txt(d,(350,616),'BÀI CỦA CON',11,'#e26f25'); txt(d,(350,644),'Dùng từ “bridge” trong câu trả lời.',17); rr(d,(350,672,540,708),10,'#f5fbff','#bdd8e7'); txt(d,(445,690),'🎤 Nói theo',13,'#1478b5','mm'); footer(d); return im

def writing():
    im,d=base('Writing · Viết từng bước',step=4,now='Điền một từ để hoàn thành câu khung.')
    rr(d,(324,344,1136,432),18,'#f3f9fc'); txt(d,(350,362),'BÀI MẪU',11,'#1882c1'); txt(d,(350,388),'I study and practise music on school days.',19); txt(d,(350,414),'Con học và luyện nhạc vào những ngày đi học.',13,'#4f6a7d')
    labels=['Chọn ý','Điền từ','Sắp xếp','Tự viết']
    for i,l in enumerate(labels):
        x=324+i*203; rr(d,(x,454,x+188,512),12,'#168fd1' if i==1 else '#f8fbfd','#168fd1' if i==1 else '#d6e4ed'); txt(d,(x+94,483),f'{i+1}. {l}',13,'#fff' if i==1 else '#526d80','mm')
    rr(d,(324,534,1136,628),18,'#fff','#d8e6ef'); txt(d,(350,552),'ĐỀ BÀI',11,'#e26f25'); txt(d,(350,580),'I study and practise _____ on school days.',21); txt(d,(350,612),'Con chọn từ phù hợp để điền vào câu.',14,'#4f6a7d')
    for i,o in enumerate(['music','river','museum','windy']): rr(d,(324+i*203,650,510+i*203,704),12,'#fff','#cbdde8'); txt(d,(417+i*203,677),o,14,'#17395d','mm')
    rr(d,(324,724,620,766),11,'#f3efff','#d2c5ef'); txt(d,(472,745),'🦊 Milo chữa bằng tiếng Việt',12,'#6545b0','mm'); footer(d); return im

images=[('VOCABULARY',vocabulary()),('GRAMMAR',grammar()),('LISTENING',listening()),('READING',reading()),('SPEAKING',speaking()),('WRITING',writing())]
for name,im in images: im.save(OUT/f'MILO_V60_19_MINH_CHUNG_{name}.png')
# Contact sheet
thumbs=[]
for name,im in images:
    t=im.copy();t.thumbnail((880,550));thumbs.append((name,t))
sheet=Image.new('RGB',(1800,1780),'#eaf4fa');d=ImageDraw.Draw(sheet);txt(d,(70,45),'MILO V60.19 · MINH CHỨNG 6 KỸ NĂNG',30,'#17395d');txt(d,(70,88),'Bản dựng từ dữ liệu và layout thực tế; không phải ảnh chụp cửa sổ EXE.',14,'#60778a')
for idx,(name,t) in enumerate(thumbs):
    x=50+(idx%2)*875;y=130+(idx//2)*540;rr(d,(x,y,x+825,y+500),20,'#fff','#d5e5ef');txt(d,(x+25,y+18),name,18,'#1682c1');sheet.paste(t,(x+20,y+55))
sheet.save(OUT/'MILO_V60_19_MINH_CHUNG_6_KY_NANG.png')
print('created',len(images)+1,'images')
