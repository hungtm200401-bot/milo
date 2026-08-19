from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'MINH_CHUNG_V60_24'
student_css=(ROOT/'student-chat-v60-24.css').read_text(encoding='utf-8')
admin_css=(ROOT/'admin-ai-connection-v60-24.css').read_text(encoding='utf-8')
base_css='''
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;font-family:Arial,"Segoe UI",sans-serif;color:#263e5c;background:linear-gradient(180deg,#eaf8ff,#f5fbe8)}
.hidden{display:none!important}.app{min-height:100vh;padding:14px clamp(12px,2vw,28px) 28px;overflow:hidden}.header{width:min(1660px,100%);max-width:1660px;margin:0 auto 10px;display:flex;align-items:center;justify-content:space-between}.brand{display:flex;align-items:center;gap:10px}.brand-badge{width:46px;height:46px;display:grid;place-items:center;border-radius:50%;background:#fff2c5;font-size:25px}.brand p{margin:0;color:#61778d;font-size:10px;font-weight:900;letter-spacing:.08em}.brand h1{margin:2px 0 0;font-size:21px}.header-actions{display:flex;gap:8px;align-items:center}.grade-select,.pill,.avatar{min-height:42px;border:1px solid #d4e2ec;border-radius:999px;background:#fff;padding:8px 12px;color:#3a5c79;font-weight:850}.avatar{width:42px;padding:0;background:#7764cf;color:#fff}.layout{width:min(1660px,100%);max-width:1660px;margin:auto;display:grid;grid-template-columns:164px minmax(0,1fr);gap:16px}.card{background:#fffdf8ee;border:1px solid #bcdced;border-radius:24px;box-shadow:0 18px 42px #36789c20}.nav{padding:11px;align-self:start;display:grid;gap:7px}.nav-btn{min-height:62px;border:0;background:transparent;border-radius:15px;padding:9px;text-align:left;display:flex;align-items:center;gap:9px;color:#60758a;font-weight:800}.nav-btn span:first-child{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;background:#eef7ff;font-size:20px}.nav-btn.active{background:#fff0d6;color:#7b5b24}.main{min-width:0;min-height:820px;overflow:hidden;padding:18px;background:linear-gradient(180deg,#f6fdffed,#e9f8ffed 54%,#f7fbeaef)}
.view{height:100%;min-height:0}.section-top{display:flex;align-items:center;justify-content:space-between}.section-top p{margin:0;color:#7356b8;font-size:10px;font-weight:950;letter-spacing:.09em}.section-top h2{margin:3px 0 0;color:#243f60;font-size:24px}.bubble{border-radius:16px}.bubble.milo{background:#fff;border:1px solid #dbe8f3;color:#334e68;align-self:flex-start}.bubble.user{background:#e7f6ff;color:#245a82;align-self:flex-end;margin-left:auto}.messages{display:flex;flex-direction:column}.icon-btn{border:0;border-radius:14px;background:#edf7ff;color:#286c9d;font-size:21px;cursor:pointer}.chat-input button:last-child{background:linear-gradient(135deg,#7b65d3,#55a8d8);color:#fff}.tutor-quick button{cursor:pointer}.milo-chat-page-title{display:flex}.milo-chat-pro-layout{display:block}
'''


def student_html(state='ready', vip=False):
  status={'ready':'Milo đã sẵn sàng','error':'Milo chưa thể kết nối. Con hãy thử lại nhé','connecting':'Milo đang kết nối…'}[state]
  tier='VIP PRO MAX' if vip else 'AI Plus'
  badge='pro' if vip else 'plus'
  error_btn='' if state!='error' else '<button id="miloStatusRetry" class="milo-status-retry" type="button">Thử lại</button>'
  vip_card='' if vip else '''<aside id="miloVipMiniCard" class="milo-vip-mini-card" aria-label="Luyện chuyên sâu cùng Milo"><div><span aria-hidden="true">🌟</span><div><b>Luyện chuyên sâu cùng Milo</b><small>Phát âm chi tiết · bài luyện cá nhân · theo dõi tiến bộ</small></div></div><div class="milo-vip-mini-actions"><button type="button">Dùng thử 24 giờ</button><button type="button" class="link">Xem gói</button></div></aside>'''
  return f'''<!doctype html><html><head><meta charset="utf-8"><style>{base_css}\n{student_css}</style></head><body class="unified-student-ui milo-chat-page-open"><div class="app"><header class="header"><div class="brand"><div class="brand-badge">🦊</div><div><p>LỚP 2 · UNIT 6</p><h1>Milo English Adventure</h1></div></div><div class="header-actions"><select class="grade-select"><option>Lớp 2</option></select><span class="pill">🔥 7 ngày</span><span class="pill">⭐ 125</span><button class="avatar">M</button></div></header><div class="layout"><nav class="nav card"><button class="nav-btn"><span>▶</span><span>Học ngay</span></button><button class="nav-btn"><span>🗺️</span><span>Hành trình</span></button><button class="nav-btn active"><span>💬</span><span>Trò chuyện</span></button><button class="nav-btn"><span>🐾</span><span>Thú cưng</span></button><button class="nav-btn"><span>🏆</span><span>Thành tích</span></button></nav><main class="main card"><section id="view-chat" class="view milo-chat-pro-view" aria-labelledby="chatPageTitle">
    <div class="section-top milo-chat-page-title"><div><p>LUYỆN GIAO TIẾP</p><h2 id="chatPageTitle">Trò chuyện cùng Milo</h2></div><div class="milo-chat-page-chips"><span>Lớp 2 · Unit 6</span><b class="chat-access-badge {badge}">{tier}</b></div></div>
    <div class="milo-chat-pro-layout" id="miloChatProLayout"><main class="milo-chat-pro-main" id="miloChatProMain">
      <header class="milo-chat-workspace-head"><div class="milo-chat-avatar">🦊</div><div class="milo-chat-workspace-title"><small>TRÒ CHUYỆN CÙNG MILO</small><h2>Hỏi bài, luyện nói và sửa câu</h2><span class="milo-friendly-status" data-state="{state}"><i></i><b>{status}</b></span></div><div class="milo-chat-workspace-chips"><span>Lớp 2 · Unit 6</span><b>{tier}</b></div>{error_btn}</header>
      <div class="chat-large" aria-label="Khu vực trò chuyện"><div id="messages" class="messages"><div class="bubble milo">Hello! Mình là Milo. Con gửi từ, câu hoặc bài đang khó nhé.</div><div class="bubble user">Milo ơi, giúp con nói câu “Con thích môn Mỹ thuật” bằng tiếng Anh.</div><div class="bubble milo"><b>Con có thể nói:</b> I like Art.<br><small>“I like…” dùng để nói về điều con yêu thích. Con thử đọc lại câu này nhé.</small></div></div><div class="tutor-quick"><button>Giải thích dễ hơn</button><button>Cho con ví dụ khác</button><button>Luyện nói cùng Milo</button></div><form class="chat-input"><button type="button" class="icon-btn" aria-label="Nói với Milo">🎤</button><input placeholder="Hỏi Milo bằng tiếng Việt hoặc tiếng Anh…"><button class="icon-btn" aria-label="Gửi câu hỏi">➤</button></form></div>
      {vip_card}
    </main></div>
  </section></main></div></div></body></html>'''

admin_base='''
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;font-family:Arial,"Segoe UI",sans-serif;color:#263e5c;background:#edf5fb}.admin-shell{height:100vh;display:grid;grid-template-columns:250px 1fr}.admin-nav{padding:24px 16px;background:#182b43;color:#fff}.admin-nav h1{font-size:21px;margin:0 0 5px}.admin-nav p{font-size:12px;color:#aac2d8;margin:0 0 24px}.admin-nav button{width:100%;min-height:48px;margin:5px 0;border:0;border-radius:12px;background:transparent;color:#dcebf6;text-align:left;padding:10px 13px;font-weight:800}.admin-nav button.active{background:#41a9d8;color:#fff}.admin-main{padding:24px;overflow:auto}.admin-main>h2{font-size:27px;margin:0 0 5px}.admin-main>p{color:#6d7f91;margin:0 0 20px}.orders-card{background:#fff;border:1px solid #dbe6ef;border-radius:20px;padding:20px;box-shadow:0 14px 30px #426a8f12}.orders-head{display:flex;justify-content:space-between;align-items:flex-start}.orders-head .eyebrow{font-size:10px;color:#7055b4;font-weight:950;letter-spacing:.08em;margin:0}.orders-head h2{margin:4px 0 4px}.orders-head p{margin:0;color:#6d7f91}.orders-head>span{background:#edf6ff;border-radius:999px;padding:8px 11px;font-size:12px;color:#57738d}
'''

def admin_html():
  return f'''<!doctype html><html><head><meta charset="utf-8"><style>{admin_base}\n{admin_css}</style></head><body><div class="admin-shell"><aside class="admin-nav"><h1>MILO QUẢN TRỊ</h1><p>VIP PRO MAX · Database</p><button>📋 Đơn chờ duyệt</button><button>👥 Tài khoản</button><button class="active">✨ Kết nối AI</button><button>📚 Chương trình học</button></aside><main class="admin-main"><h2>Trung tâm quản trị Milo</h2><p>Công cụ kỹ thuật được tách khỏi ứng dụng học sinh.</p><section class="orders-card admin-ai-connection-panel" id="connectionPanel"><div class="orders-head"><div><p class="eyebrow">CHỈ DÀNH CHO QUẢN TRỊ</p><h2>Kết nối AI</h2><p>Kiểm tra trạng thái dịch vụ mà không hiển thị khóa bí mật.</p></div><span>Kiểm tra gần nhất: 13:48</span></div><div class="admin-ai-status-grid"><article><span>⚙️</span><small>CẤU HÌNH</small><b>Đã cấu hình</b></article><article><span>🔗</span><small>KẾT NỐI</small><b>Kết nối thành công</b></article><article><span>🟢</span><small>DỊCH VỤ</small><b>Dịch vụ sẵn sàng</b></article></div><div class="admin-ai-actions"><button>↻ Làm mới trạng thái</button><button>Kiểm tra kết nối</button></div><p class="admin-ai-message">Trang này không hiển thị khóa hoặc thông tin bí mật.</p></section></main></div></div></body></html>'''

metrics=[]
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
  for w,h in [(1366,768),(1600,900),(1920,1080)]:
    page=browser.new_page(viewport={'width':w,'height':h}, device_scale_factor=1)
    page.set_content(student_html('ready',False),wait_until='load')
    page.screenshot(path=str(OUT/f'01_SAU_TRO_CHUYEN_AI_PLUS_{w}x{h}.png'))
    m=page.evaluate('''() => { const q=s=>document.querySelector(s); const r=s=>q(s)?.getBoundingClientRect(); const body=document.body; const vip=r('#miloVipMiniCard'); const main=r('#miloChatProMain'); return {viewport:[innerWidth,innerHeight], bodyScroll:body.scrollHeight-innerHeight, input:r('.chat-input input'), mic:r('.chat-input button:first-child'), send:r('.chat-input button:last-child'), messages:r('#messages'), vip, main, vipRatio:vip&&main?vip.height/main.height:null, technical:[...document.querySelectorAll('body *')].some(n=>/\\.env|Kiểm tra API|endpoint|token|model/i.test((n.childNodes.length===1&&n.firstChild?.nodeType===3?n.textContent:'')))} }''')
    metrics.append(m)
    page.close()
  page=browser.new_page(viewport={'width':1366,'height':768})
  page.set_content(student_html('error',False),wait_until='load')
  page.screenshot(path=str(OUT/'02_MAT_KET_NOI_THAN_THIEN_1366x768.png'))
  page.close()
  page=browser.new_page(viewport={'width':1366,'height':768})
  page.set_content(student_html('ready',True),wait_until='load')
  page.screenshot(path=str(OUT/'03_TAI_KHOAN_VIP_TU_NHAN_QUYEN_1366x768.png'))
  page.close()
  page=browser.new_page(viewport={'width':1600,'height':900})
  page.set_content(admin_html(),wait_until='load')
  page.screenshot(path=str(OUT/'04_QUAN_TRI_KET_NOI_AI_1600x900.png'))
  page.close()
  browser.close()
(ROOT/'reports-v60-24/UI_METRICS_V60_24.json').write_text(json.dumps(metrics,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(metrics,ensure_ascii=False,indent=2))
