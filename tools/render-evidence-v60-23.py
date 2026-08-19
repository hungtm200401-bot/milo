from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import textwrap
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'MINH_CHUNG_V60_23'; OUT.mkdir(exist_ok=True)
FONT='/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf'; BOLD='/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf'
def f(s,b=False): return ImageFont.truetype(BOLD if b else FONT,s)
def rr(d,b,r,fill,outline=None,w=1): d.rounded_rectangle(b,radius=r,fill=fill,outline=outline,width=w)
def tx(d,xy,t,s=16,c='#17395d',b=False,anchor=None): d.text(xy,t,font=f(s,b),fill=c,anchor=anchor)
def para(d,xy,t,width,s=15,c='#49657a',b=False): d.multiline_text(xy,'\n'.join(textwrap.wrap(t,width)),font=f(s,b),fill=c,spacing=5)
def shell(title,subtitle):
    im=Image.new('RGB',(1366,768),'#edf6fb');d=ImageDraw.Draw(im)
    rr(d,(18,14,1348,62),16,'#fff','#d8e7f2');tx(d,(38,38),'← HÀNH TRÌNH',13,'#1977ad',True,anchor='lm');tx(d,(683,38),'LỚP 2 · UNIT 1',14,'#17395d',True,anchor='mm');tx(d,(1325,38),'V60.23',12,'#60798b',True,anchor='rm')
    rr(d,(18,76,230,744),20,'#fff','#d8e7f2');tx(d,(38,102),'7 BƯỚC HỌC',12,'#1882c1',True)
    labels=['Milo giảng','Học cách làm','Làm cùng Milo','Con tự làm','Milo chữa','Kiểm tra nhanh','Hoàn thành']
    for i,l in enumerate(labels):
        y=132+i*70; rr(d,(34,y,214,y+52),12,'#e8f6ff' if i==3 else '#f8fbfd','#9ed2ed' if i==3 else None);tx(d,(50,y+26),f'{i+1}',12,'#168bd0',True,anchor='lm');tx(d,(75,y+26),l,13,'#17395d',i==3,anchor='lm')
    rr(d,(246,76,1348,150),20,'#fff','#d8e7f2');tx(d,(272,98),subtitle,11,'#1882c1',True);tx(d,(272,124),title,23,'#17395d',True)
    rr(d,(246,164,1348,718),22,'#fff','#d8e7f2')
    tx(d,(1285,742),'Ảnh minh chứng thành phần tự động từ mã/CSS V60.23; không phải ảnh chụp EXE Windows thật.',10,'#657b8b',False,anchor='rm')
    return im,d

def no_answer():
    im,d=shell('Bài sách thật · chưa nộp nên chưa có đáp án','BOOK EXERCISE · G2 U1 · Grammar 1 · ảnh frame_0018.webp')
    rr(d,(276,188,1318,242),13,'#eef8ff','#b9dceb');tx(d,(294,207),'📘 Bài từ ảnh sách đã đối chiếu',14,'#176e9d',True);tx(d,(294,229),'Lớp 2 · Unit 1 · Grammar 1 · Bài 5 · vùng Activity 5',11,'#176e9d')
    tx(d,(286,270),'ĐỀ BÀI',11,'#e26f25',True);tx(d,(286,302),'Santiago ___ English and art. He ___ math or music.',21,'#17395d',True)
    para(d,(286,336),'Chọn hai dạng đúng để hoàn thành câu. Ví dụ của Milo dùng nhân vật và động từ khác; đáp án của câu này không nằm trong DOM.',92,14)
    opts=['likes / doesn’t like','like / don’t like','likes / don’t like','like / doesn’t like']
    for i,o in enumerate(opts):
        x=286+(i%2)*500;y=402+(i//2)*68;rr(d,(x,y,x+474,y+52),12,'#fff','#c6dce8');tx(d,(x+18,y+26),o,15,'#294d67',True,anchor='lm')
    rr(d,(286,554,486,600),12,'#fff','#c5dbe8');tx(d,(386,577),'💡 Cho con một gợi ý',13,'#76601f',True,anchor='mm');rr(d,(500,554,696,600),12,'#f5f0ff','#d4c6ef');tx(d,(598,577),'🧭 Con chưa hiểu',13,'#6545ac',True,anchor='mm')
    rr(d,(286,626,806,686),15,'#6650d7');tx(d,(546,656),'Kiểm tra đáp án',17,'#fff',True,anchor='mm')
    im.save(OUT/'01_BOOK_EXERCISE_NO_ANSWER_1366x768.png')

def first_wrong():
    im,d=shell('Sai lần đầu · chỉ gợi ý nhỏ, chưa mở đáp án','LUỒNG CHỮA BÀI THÍCH ỨNG')
    tx(d,(286,194),'Câu hiện tại',11,'#1882c1',True);tx(d,(286,221),'We ___ see a lot of fireworks.',20,'#17395d',True)
    rr(d,(286,258,1304,424),16,'#fff7f7','#efbcbc');tx(d,(308,282),'Chưa đúng, nhưng Milo chưa mở đáp án',17,'#8f4949',True)
    tx(d,(308,316),'Câu của con',10,'#718697',True);tx(d,(308,338),'did',15,'#17395d')
    tx(d,(620,316),'Phần cần xem lại',10,'#718697',True);para(d,(620,338),'Đây là dự đoán về tương lai. Hãy nhìn từ “see” và nhớ dạng trợ động từ phù hợp.',62,14,'#17395d')
    tx(d,(308,394),'Con thử lại',10,'#718697',True);tx(d,(308,414),'Đọc gợi ý rồi làm lại câu này.',14,'#17395d')
    tx(d,(286,456),'CON ĐANG VƯỚNG Ở ĐÂU?',12,'#6545ac',True)
    labels=['Giải thích đề bài','Nhắc lại kiến thức','Cho con một gợi ý','Làm một ví dụ khác','Con vẫn chưa hiểu']
    for i,l in enumerate(labels):
        x=286+(i%3)*326;y=486+(i//3)*62;rr(d,(x,y,x+306,y+48),12,'#fff','#c5dbe8');tx(d,(x+153,y+24),l,13,'#256681',True,anchor='mm')
    rr(d,(286,630,806,690),15,'#6650d7');tx(d,(546,660),'Thử lại câu hiện tại',17,'#fff',True,anchor='mm')
    im.save(OUT/'02_FIRST_WRONG_HINT_ONLY_1366x768.png')

def voice():
    im,d=shell('Từ mới · Đọc chậm và Con đọc lại miễn phí','VOICE V60.23 · en-US · tốc độ chậm 0,55')
    crop=Image.open(ROOT/'book-exercise-assets/g2-u1-vocab-grid.webp').convert('RGB');crop.thumbnail((350,235));rr(d,(278,188,654,458),16,'#fbfdff','#d8e6ef');im.paste(crop,(291,205));tx(d,(291,432),'Vùng ảnh nguồn đã cắt',11,'#657b8b')
    rr(d,(676,188,1318,458),17,'#fbfdff','#d8e6ef');tx(d,(700,210),'TỪ MỚI',11,'#1882c1',True);tx(d,(700,246),'math',28,'#17395d',True);tx(d,(810,250),'/mæθ/',16,'#6545b0',True);tx(d,(700,286),'môn Toán',16,'#397056',True);tx(d,(700,320),'I have math today.',15,'#49657a')
    actions=[('🔊 Nghe','0,76'),('🐢 Đọc chậm','0,55'),('🎤 Con đọc lại','MIỄN PHÍ')]
    for i,(a,b) in enumerate(actions):
        x=700+i*190;rr(d,(x,360,x+174,414),12,'#fff','#a9d4e5');tx(d,(x+87,378),a,13,'#244b5f',True,anchor='mm');tx(d,(x+87,401),b,10,'#657786',anchor='mm')
    rr(d,(278,480,1046,682),17,'#f5fcff','#b9ddea');tx(d,(300,502),'LUYỆN ĐỌC CƠ BẢN · MIỄN PHÍ',10,'#39708a',True);tx(d,(300,532),'math',21,'#243b53',True);tx(d,(300,566),'Milo đang nghe…',15,'#176b49',True)
    rr(d,(300,596,510,642),12,'#fff','#a9d4e5');tx(d,(405,619),'■ Dừng',13,'#244b5f',True,anchor='mm');rr(d,(528,596,738,642),12,'#fff','#a9d4e5');tx(d,(633,619),'▶ Nghe giọng con',13,'#244b5f',True,anchor='mm')
    tx(d,(300,662),'Không chấm điểm giả; nếu không có SpeechRecognition, MediaRecorder cho phép ghi và nghe lại.',11,'#657786')
    rr(d,(1066,480,1318,682),17,'#fff8e8','#efcf7d');tx(d,(1192,516),'⭐ VIP PRO MAX',15,'#855b00',True,anchor='mm');para(d,(1090,548),'Chấm 8 chỉ số, phân tích âm đầu/âm cuối/trọng âm và lịch sử tiến bộ chỉ mở khi quyền VIP hoặc dùng thử còn hạn.',28,13,'#6b531c');rr(d,(1090,624,1294,670),12,'#fff','#efcf7d');tx(d,(1192,647),'Chấm chuyên sâu',13,'#855b00',True,anchor='mm')
    im.save(OUT/'03_SLOW_VOICE_FREE_REPEAT_VIP_SEPARATE_1366x768.png')

def source_map():
    im,d=shell('Bảng đối chiếu bài tập với ảnh nguồn','30 BÀI ĐỌC TRỰC TIẾP · 48 BÀI TỪ MAP ẢNH ĐÃ XÁC MINH')
    headers=['Lớp/Unit','Section','Ảnh nguồn','Vùng ảnh','Trạng thái']
    xs=[280,400,630,870,1150]
    for x,h in zip(xs,headers):tx(d,(x,202),h,11,'#1882c1',True)
    rows=[('2 / 1','Grammar 1','frame_0018.webp','Activity 5 table','Đã nhìn ảnh'),('2 / 6','Reading 1','frame_0077.webp','Sam’s Job','Đã nhìn ảnh'),('2 / 12','Reading 1','070.webp','Great Outings','Đã nhìn ảnh'),('3 / 1','Grammar 1','026.webp','Instructions','Đã nhìn ảnh'),('3 / 6','Vocabulary 1','094.webp','Shopping words','Đã nhìn ảnh'),('3 / 12','Vocabulary 1','180.webp','Activity 1','Đã nhìn ảnh')]
    for i,row in enumerate(rows):
        y=228+i*64;rr(d,(270,y,1320,y+52),10,'#f8fbfd' if i%2==0 else '#fff','#e0eaf0')
        for x,val in zip(xs,row):tx(d,(x,y+26),val,12,'#17395d',val=='Đã nhìn ảnh',anchor='lm')
    rr(d,(278,632,1310,690),13,'#fff5df','#ecd18f');tx(d,(296,652),'⚠ 335 dòng OCR “needs review” chỉ nằm trong bảng mapping, không được tự động kích hoạt thành bài học.',13,'#765713',True);tx(d,(296,676),'Tệp đối chiếu: BOOK_EXERCISE_SOURCE_MAP_V60_23.csv / .json',11,'#765713')
    im.save(OUT/'04_SOURCE_MAPPING_VERIFICATION_1366x768.png')

no_answer();first_wrong();voice();source_map();print('created 4 evidence images')
