const a0_0x30c1c5=a0_0x1f32;(function(_0x2d20ec,_0x3bd7db){const _0x20d108=a0_0x1f32,_0xd5274f=_0x2d20ec();while(!![]){try{const _0x38fb6c=parseInt(_0x20d108(0x233))/0x1+parseInt(_0x20d108(0x1e3))/0x2+-parseInt(_0x20d108(0x218))/0x3*(-parseInt(_0x20d108(0x263))/0x4)+-parseInt(_0x20d108(0x209))/0x5*(-parseInt(_0x20d108(0x1f6))/0x6)+parseInt(_0x20d108(0x19b))/0x7+-parseInt(_0x20d108(0x25b))/0x8*(-parseInt(_0x20d108(0x1f8))/0x9)+parseInt(_0x20d108(0x244))/0xa*(-parseInt(_0x20d108(0x208))/0xb);if(_0x38fb6c===_0x3bd7db)break;else _0xd5274f['push'](_0xd5274f['shift']());}catch(_0x5d7e26){_0xd5274f['push'](_0xd5274f['shift']());}}}(a0_0x47fa,0x652dc));var modelStructure=null,model,swift,dart,json,universalBOM='\ufeff';let elements=[[{'field':a0_0x30c1c5(0x214),'type':'text','label':a0_0x30c1c5(0x250),'required':!![]},{'field':'type','type':'select','label':a0_0x30c1c5(0x22b),'required':!![],'option':{'ajax':![],'data':{'s':a0_0x30c1c5(0x235),'t':a0_0x30c1c5(0x204),'date':a0_0x30c1c5(0x1c4),'i':'Integer'}}},{'field':a0_0x30c1c5(0x1e7),'type':a0_0x30c1c5(0x1de),'label':a0_0x30c1c5(0x253),'required':!![],'option':{'ajax':![],'data':{0x1:a0_0x30c1c5(0x198),0x0:'No'}}},{'field':a0_0x30c1c5(0x254),'type':a0_0x30c1c5(0x1de),'label':a0_0x30c1c5(0x1db),'required':![],'placeholder':a0_0x30c1c5(0x22d),'option':{'ajax':!![],'data_model_name':'DataModel','data_model_field':'','data_model_value':'','data_model_attributes':[a0_0x30c1c5(0x214)],'data_model_default_field':'id'}}],[{'field':'size','type':'text','label':'Size','required':![]},{'field':a0_0x30c1c5(0x1b6),'type':'select','label':a0_0x30c1c5(0x25e),'required':![],'option':{'ajax':![],'data':{'':'n/a',0x1:a0_0x30c1c5(0x198),0x0:'No'}}},{'field':a0_0x30c1c5(0x249),'type':a0_0x30c1c5(0x1de),'label':'Protected','required':![],'option':{'ajax':![],'data':{0x0:'No',0x1:a0_0x30c1c5(0x198)}}},{'field':a0_0x30c1c5(0x1b7),'type':a0_0x30c1c5(0x231),'label':a0_0x30c1c5(0x1e6),'required':![]}],[{'field':'description','type':'text','label':a0_0x30c1c5(0x23d),'required':![]}]],colDef=[{'targets':0x0,'data':a0_0x30c1c5(0x214),'label':'Name'},{'targets':0x1,'data':'type','label':'Type','render':function(_0x43a735,_0x4a4ea9,_0x4cd034,_0x239b0f){const _0x2f35d4=a0_0x30c1c5;if(_0x43a735=='i')return _0x2f35d4(0x1a9)+_0x4cd034[_0x2f35d4(0x1bd)]+')';if(_0x43a735=='s')return'Varchar('+_0x4cd034['size']+')';if(_0x43a735=='t')return _0x2f35d4(0x204);if(_0x43a735=='date')return _0x2f35d4(0x1c4);return _0x43a735;}},{'targets':0x2,'data':a0_0x30c1c5(0x1e7),'label':a0_0x30c1c5(0x227),'render':function(_0x42774c,_0x54178f,_0x377f07,_0x345d11){const _0x2ce8df=a0_0x30c1c5;return _0x42774c==0x1?'NO':_0x2ce8df(0x18d);}},{'targets':0x3,'data':'protected','label':'Private','render':function(_0x27e341,_0x53a8b3,_0x3d58d4,_0x393cfd){return _0x27e341==0x1?'YES':'NO';}},{'targets':0x4,'data':a0_0x30c1c5(0x1b6),'label':a0_0x30c1c5(0x25e),'render':function(_0x331e11,_0x59c97c,_0x5cf76c,_0x446ced){const _0x964fe1=a0_0x30c1c5;return _0x331e11==0x1?_0x964fe1(0x18d):'NO';}},{'targets':0x5,'data':a0_0x30c1c5(0x1b7),'label':'Default'},{'targets':0x6,'data':a0_0x30c1c5(0x18f),'label':'Description'}];function getData(_0x5e87c8,_0x209bc3){const _0x2884ea=a0_0x30c1c5;k['get']('ModelAttribute',_0x2884ea(0x1df),_0x5e87c8,[],function(_0x4e8b77){const _0x2cc747=_0x2884ea;let _0x2c444f=0x0,_0x1696e6=[],_0x2a64f4=[{'targets':_0x2c444f,'data':'id','label':'#'}];_0x4e8b77[_0x2cc747(0x1a2)][_0x2cc747(0x1ae)]>0x0&&(modelStructure=_0x4e8b77[_0x2cc747(0x1a2)],_0x4e8b77['data'][_0x2cc747(0x18c)](_0x52c458=>{const _0x2c0b8c=_0x2cc747;_0x2c444f++;let _0x477351='text';if(_0x52c458[_0x2c0b8c(0x236)]=='t')_0x477351=_0x2c0b8c(0x1b4);if(_0x52c458[_0x2c0b8c(0x236)]==_0x2c0b8c(0x1bf))_0x477351=_0x2c0b8c(0x1bf);_0x2a64f4['push']({'targets':_0x2c444f,'data':_0x52c458[_0x2c0b8c(0x214)],'label':_0x52c458[_0x2c0b8c(0x214)]}),_0x1696e6['push']([{'field':_0x52c458[_0x2c0b8c(0x214)],'type':_0x477351,'label':_0x52c458['name'],'required':_0x52c458[_0x2c0b8c(0x1e7)]==0x1?!![]:![]}]);}));_0x2c444f++,_0x2a64f4[_0x2cc747(0x18e)]({'targets':_0x2c444f,'data':_0x2cc747(0x1a0),'label':_0x2cc747(0x1a0)}),_0x2c444f++,_0x2a64f4['push']({'targets':_0x2c444f,'data':_0x2cc747(0x23e),'label':_0x2cc747(0x23e)});var _0x34cf2c=new KyteTable(k,$(_0x2cc747(0x1a5)),{'name':_0x209bc3,'field':null,'value':null},_0x2a64f4,!![],[0x0,_0x2cc747(0x215)],!![],!![]);_0x34cf2c[_0x2cc747(0x1ca)]();var _0x5444b5=new KyteForm(k,$(_0x2cc747(0x1c3)),_0x209bc3,null,_0x1696e6,_0x209bc3,_0x34cf2c,!![],$(_0x2cc747(0x239)));_0x5444b5[_0x2cc747(0x1ca)](),_0x34cf2c[_0x2cc747(0x1ea)](_0x5444b5),swift=generate_swift(_0x209bc3),dart=generate_dart(_0x209bc3);});}function a0_0x47fa(){const _0x2fd334=['cvn0CMLUzZ8GAwq7dqO','cvn0CMLUzZ8Gzgf0zv9JCMvHDgvKoW0k','tNvSBa','rMvHDhvYzsbJB21PBMCGC29VBIe','cqLLBMDPBMvwzxjZAw9Uid0GANnVBLSNzw5NAw5Lx3zLCNnPB24NxtSncG','C3rYDwn0ia','vhLWzq','cqLKyxrHwYDRExrLx2fJy291BNqNxsa9ihrOAxmUA3L0zv9Hy2nVDw50oW0k','tI9b','cwXLDcbJCMvHDgvKx2j5oIbtDhjPBMC/dqO','lNn3Awz0dqOVlW0klY8Gq3jLyxrLzcbIEsblExrLifnOAxb5yxjKig9Uia','Fq0k','Dgv4Da','Aw50','ndeXnZuXr29otNrX','zg93BMXVywq','u3rYAw5N','DhLWzq','cvn0CMLUzZ8GDg9Rzw47dqO','j10Gpsb0AgLZlG','i25LD0rHDge','i3bHz2vmB2fKzxjnB2rHBa','cqLKyxrHwYDZzxnZAw9Uj10Gpsb0AgLZlNnLC3nPB247dqO','cqLKzwXLDgvKid0GANnVBLSNzgvSzxrLzcDDoW0k','rgvZy3jPChrPB24','zgf0zv9TB2rPzMLLza','cqLKyxrHwYDZzxnZAw9UugvYBwLZC2LVBIDDid0GDgHPCY5ZzxnZAw9UugvYBwLZC2LVBJSncG','cqLHy2nVDw50swqGpsbQC29UwYDHy2nVDw50x2LKj107dqO','tw9KzwXbDhrYAwj1Dgu','cqL0CMfUC2fJDgLVBIa9igPZB25Bj3rYyw5Zywn0Aw9Uj107dqO','cqLKyxrHwYDKyxrLx21VzgLMAwvKj10Gpsb0AgLZlMrHDgvFBw9KAwzPzwq7dqO','mZm2nJyWywrnwg5j','B2n0zxqVC3rYzwfT','cqL9dqO','cqL0AgLZlMT5DgvFywnJB3vUDcWncG','cvn0CMLUzZ8GDhHuAw1LC3rHBxa7dqO','ChjVDgvJDgvK','cqLKyxrLx2nYzwf0zwqGpsbQC29UwYDKyxrLx2nYzwf0zwqNxtSncG','cvn0CMLUzZ8GC2vZC2LVBJSncG','cqL0AgLZlMrLBgv0zwrFyNKSdqO','cwXLDca','cvn0CMLUzZ8GA3L0zuLKzw47dqO','cqL0AgLZlMnYzwf0zwrFyNKSdqO','tw9KzwW','cqL0EfrPBwvZDgfTCca9igPZB25Bj3r4vgLTzxn0yw1Wj107dqO','cqLKyxrHwYDKyxrLx2rLBgv0zwqNxsa9ihrOAxmUzgf0zv9KzwXLDgvKoW0k','uMvXDwLYzwq','zM9YzwLNBKTLEu1VzgvS','AxntzxnZAw9U','cqKjcwrHDgeHlMfKzcHUzxCG','cwXLDcbRExrLx2fJy291BNq6ifn0CMLUzW0k','cwLUDd8GCMvZCg9UC2vdB2rLoW0k','y2XPy2S','zgfYDa','mteXndr2ufrbsMG','cwXLDcbKyxrLx2nYzwf0zwq6ifn0CMLUzZ8ncG','id0GANnVBLSN','vw5ZAwDUzwq','cvn0CMLUzZ8GBw9KAwzPzwrFyNK7dqO','cqL0AgLZlMT5DgvqDwiSdqO','cvn0CMLUzZ8GA3L0zv9Hy2nVDw50oW0k','cqLPzca9igPZB25Bj2LKj107dqO','nZeYmZi4qLfxA3jR','CMvTB3zLq2XHC3m','i2rVD25SB2fKrgf0yuPtt04','cqL0B2TLBIa9igPZB25Bj3rVA2vUj107dqO','cqL0AgLZlNrYyw5Zywn0Aw9Ula0k','cx0PoW0kdqO','cvn0CMLUzZ8Gzw5NAw5LvMvYC2LVBJSncG','cqLKyxrHwYD0CMfUC2fJDgLVBIDDid0GDgHPCY50CMfUC2fJDgLVBJSncG','cuXPC3q8','zM9YrwfJAa','wuvt','ChvZAa','zgvZy3jPChrPB24','ChjLDMvUDerLzMf1Bhq','cwXLDcbTB2rPzMLLzf9IEtOGu3rYAw5NpW0k','cqLJyxnL','C2HVDW','cqLKyxrHwYDKCMf3j10Gpsb0AgLZlMrYyxC7dqO','cqLTB2rLBca9igPZB25Bj21VzgvSj107dqO','i21VzgfSrM9YBq','yM9KEq','wwvZ','i2f0DhjPyNv0zs10ywjSzq','cx0ncG0k','ndu4mdC5m2j5u2znAq','cwXLDcbKzwXLDgvKx2j5oIbtDhjPBMC/dqO','cvn0CMLUzZ8Gzgf0zv9TB2rPzMLLzdSncG','rgf0yt4/igrHDge7dqOncG','cs8VigT5DguGBw9KzwWGyw5Kigf1zgL0igf0DhjPyNv0zxmncG','zgf0zv9JCMvHDgvK','cvn0CMLUzZ8GBw9KzwW7dqO','zgf0yq','cqLKyxrHwYDKyxrLx2nYzwf0zwqNxsa9ihrOAxmUzgf0zv9JCMvHDgvKoW0k','i2rVD25SB2fKu3DPzNq','i2rHDgeTDgfIBgu','dqOncMLTCg9YDcbgB3vUzgf0Aw9UdqOncG','cqLKyxrHwYDTB2rPzMLLzf9IEsDDid0GDgHPCY5TB2rPzMLLzf9IEtSncG','cqLYzxnWB25ZzunVzguGpsbQC29UwYDYzxnWB25Zzv9JB2rLj107dqO','sw50ka','cqL0AgLZlMrLBgv0zwqSdqO','CMv2B2TLt2jQzwn0vvjm','ANnVBG','cvn0CMLUzZ8Gzgf0zv9KzwXLDgvKoW0k','BgvUz3rO','cqLPzIaOANnVBLSNzgf0ysDDice9ig51BgWPihSncG','cwLUDd8GzhjHDZSncG','i0rHDge','cqKjANnVBLSNzgf0ysDDlMzVCKvHy2GOkhyPihSncG','cqLJCMvHDgvKx2j5id0GANnVBLSNy3jLyxrLzf9IEsDDoW0k','Dgv4DgfYzwe','C3rVCfbYB3bHz2f0Aw9U','Dw5ZAwDUzwq','zgvMyxvSDhm','cvn0CMLUzZ8Gy3jLyxrLzf9IEtSncG','y2XHC3mG','zc1UB25L','cqLKyxrLx2rLBgv0zwqGpsbQC29UwYDKyxrLx2rLBgv0zwqNxtSncG','vvjm','C2L6zq','cqL0AgLZlNr4vgLTzxn0yw1Wla0k','zgf0zq','dqOjzw51BsbdB2rPBMDlzxLZoIbtDhjPBMCSienVzgLUz0TLEsb7dqO','i2rVD25SB2fKrgf0yvbHCNf1zxq','rgf0yu1VzgvS','i21VzgfSrgf0yuzVCM0','rgf0zq','cqLKyxrHwYDRExrLx3b1yIDDid0GDgHPCY5RExrLuhvIoW0k','AhjLzG','cqLKyxrHwYDdt05uru5ux1rzueuNxsa9ihrOAxmUy09ovevovfrzueu7dqO','i2rVD25SB2fKrgf0yuntvG','cqLKyxrHwYDKzwXLDgvKx2j5j10Gpsb0AgLZlMrLBgv0zwrFyNK7dqO','Aw5PDa','lZ9YzwrPCJ0','cqLKyxrHwYDJCMvHDgvKx2j5j10Gpsb0AgLZlMnYzwf0zwrFyNK7dqO','cwXLDcbKyxrLx21VzgLMAwvKoIbtDhjPBMC/dqO','cqLYzxr1CM4Gzgf0ytSncG','i25LD0f0DhjPyNv0zq','cqL0AgLZlMvUz2LUzvzLCNnPB24SdqO','khSncG','cqLKyxrHwYD0EfrPBwvZDgfTCcDDid0GDgHPCY50EfrPBwvZDgfTCdSncG','cqLZzxnZAw9UugvYBwLZC2LVBIa9igPZB25Bj3nLC3nPB25qzxjTAxnZAw9Uj107dqO','i0v4Cg9YDa','yxbWzw5Kq2HPBgq','cqL0AgLZlMnptLrftLruwvbfla0k','CMvWBgfJzq','C3DPzNq','sw50','cqKjzgf0yvSNzgf0ysDDid0GDgHPCY5KyxrHis5TyxaOkhyPid0+ihyUDg9kC29UkcKPlNrVtgLZDcGPoW0k','rKSGtw9KzwW','vw5KzwzPBMvK','ihSncG','C2vSzwn0','zgf0yu1VzgvS','cqL0AgLZlMfJy291BNrjzcWncG','j107dqO','cqLMAw5HBcbnyxa8u3rYAw5NlcbKEw5HBwLJpIbKyxrHid0GBMv3ie1HCdXtDhjPBMCSigr5BMfTAwm+kcK7dqO','mtu2nZu3nNf0CKzVua','cqL0AgLZlMrHDgvFBw9KAwzPzwqSdqO','CgfYCxvLDa','rgvMyxvSDa','CMvXDwLYzwq','i0nVBNrYB2XSzxjZ','AgLKzq','yMLUzevKAxq','cqL0AgLZlMrYyxCSdqO','cqKjzgf0ysa9idW','tw9KzwWGqxr0CMLIDxrL','cqLRExrLtNvTid0GANnVBLSNA3L0zv9UDw0NxtSncG','cvn0CMLUzZ8GzgvSzxrLzdSncG0k','ywrKq2XHC3m','lY8ncI8Via','rgf0ys5MCM9TsNnVBIH2ksK7dqO','i21VzgvSlw5HBwu','cqLKyxrLx21VzgLMAwvKid0GANnVBLSNzgf0zv9TB2rPzMLLzcDDoW0k','cqL1AwqGpsbQC29UwYD1AwqNxtSncG','mJKWnJm4mMLKvujcqW','cvn0CMLUzZ8GA3L0zu51BtSncG','mJa0m2zODgv5Da','rgf0ys5MCM9TsNnVBIHnyxa8u3rYAw5NlcbKEw5HBwLJpIbQC29Uksb7dqO','i2rVD25SB2fKsLnptG','C3r5Bgu','cvn0CMLUzZ8GC2vZC2LVBLbLCM1PC3nPB247dqO','mI1KAwDPDa','cu1HCdXtDhjPBMCSigr5BMfTAwm+ihrVsNnVBIGPihSncG','Fq0kdqO','Bw9KywW','cqLKyxrHwYDYzxnWB25Zzv9JB2rLj10Gpsb0AgLZlNjLC3bVBNnLq29KztSncG','cvn0CMLUzZ8GywnJB3vUDeLKoW0k','ywn0AxzL','vgv4Da','la0k','cqL0AgLZlNjLC3bVBNnLq29KzsWncG','Dg9mB2nHBgveyxrLu3rYAw5N','odq3rvniCNjv','nu9swez3uq','i0rHDgeTBMf2lwXPBMS','lw5HDI1SAw5R','cqKjFsK7dqO','cqL0AgLZlMLKla0k','rgf0ysb7dqO','i0f0DhjPyNv0zxm','cqLRExrLuhvIid0GANnVBLSNA3L0zv9WDwiNxtSncG','i2rVD25SB2fKrgfYDa','Bg9JyxrPB24','cqL0AgLZlMT5DgvoDw0SdqO','BMfTzq','yxnJ','AhrTBa','CMvHzhK','nNDXr2DPEG','i0v4Cg9YDc1UyxyTBgLUAW','cx0ncG','cqLJt05uru5uvfLqrsa9igPZB25Bj0nptLrftLrFvfLqrsDDoW0k','cqLKyxrHwYD1AwqNxsa9ihrOAxmUDwLKoW0k','cvn0CMLUzZ8GDwLKoW0k','cqL0AgLZlMrHDgvFzgvSzxrLzcWncG','cqL0AgLZlMT5DgvjzgvUla0k','oW0k','i0f0DhjPyNv0zxmTBMf2lwXPBMS','cqLKyxrHwYDRExrLx251BsDDid0GDgHPCY5RExrLtNvToW0k','i0nVBNrYB2XSzxjZlw5HDI1SAw5R','AgfZAa'];a0_0x47fa=function(){return _0x2fd334;};return a0_0x47fa();}function generate_dart(_0x10bacc){const _0x407c74=a0_0x30c1c5;let _0x3f0dc4=new Date()[_0x407c74(0x207)]('en',{'year':'numeric','day':_0x407c74(0x1fd),'month':_0x407c74(0x1fd)}),_0x1a864e=_0x407c74(0x1f1)+model+_0x407c74(0x22f)+_0x3f0dc4+'\x0d\x0a\x0d\x0a';_0x1a864e+=_0x407c74(0x1b9)+model+_0x407c74(0x1dd),_0x1a864e+=_0x407c74(0x258),_0x1a864e+=_0x407c74(0x24b),_0x1a864e+=_0x407c74(0x237),_0x1a864e+=_0x407c74(0x21d),_0x1a864e+=_0x407c74(0x1fc),_0x1a864e+=_0x407c74(0x248),_0x1a864e+=_0x407c74(0x1b0),_0x1a864e+='\x09String?\x20cONTENTTYPE;\x0d\x0a',_0x1a864e+='\x09String?\x20transaction;\x0d\x0a',_0x1a864e+=_0x407c74(0x189),_0x1a864e+=_0x407c74(0x1a1),_0x1a864e+='\x09String?\x20kytePub;\x0d\x0a',_0x1a864e+=_0x407c74(0x1f7),_0x1a864e+=_0x407c74(0x24e),_0x1a864e+=_0x407c74(0x202),_0x1a864e+=_0x407c74(0x18b)+model+_0x407c74(0x19e),_0x1a864e+='\x09'+model+_0x407c74(0x1d1),_0x1a864e+=_0x407c74(0x206),_0x1a864e+='\x09\x09this.session,\x0d\x0a',_0x1a864e+='\x09\x09this.token,\x0d\x0a',_0x1a864e+='\x09\x09this.uid,\x0d\x0a',_0x1a864e+='\x09\x09this.sessionPermission,\x0d\x0a',_0x1a864e+=_0x407c74(0x1be),_0x1a864e+=_0x407c74(0x1eb),_0x1a864e+=_0x407c74(0x1d6),_0x1a864e+=_0x407c74(0x187),_0x1a864e+=_0x407c74(0x1d0),_0x1a864e+='\x09\x09this.model,\x0d\x0a',_0x1a864e+=_0x407c74(0x260),_0x1a864e+=_0x407c74(0x213),_0x1a864e+=_0x407c74(0x21f),_0x1a864e+=_0x407c74(0x1e0),_0x1a864e+='\x09\x09this.data\x0d\x0a',_0x1a864e+=_0x407c74(0x188),_0x1a864e+='\x09'+model+'.fromJson(Map<String,\x20dynamic>\x20json)\x20{\x0d\x0a',_0x1a864e+=_0x407c74(0x1a8),_0x1a864e+='\x09\x09session\x20=\x20json[\x27session\x27];\x0d\x0a',_0x1a864e+=_0x407c74(0x186),_0x1a864e+=_0x407c74(0x1f5),_0x1a864e+=_0x407c74(0x1d3),_0x1a864e+=_0x407c74(0x251),_0x1a864e+='\x09\x09draw\x20=\x20json[\x27draw\x27];\x0d\x0a',_0x1a864e+=_0x407c74(0x21b),_0x1a864e+=_0x407c74(0x242),_0x1a864e+=_0x407c74(0x229),_0x1a864e+=_0x407c74(0x195),_0x1a864e+=_0x407c74(0x210),_0x1a864e+=_0x407c74(0x1ee),_0x1a864e+='\x09\x09kyteIden\x20=\x20json[\x27kyte_iden\x27];\x0d\x0a',_0x1a864e+=_0x407c74(0x240),_0x1a864e+=_0x407c74(0x1af),_0x1a864e+=_0x407c74(0x1ec)+model+'Data>[];\x0d\x0a',_0x1a864e+=_0x407c74(0x1b2),_0x1a864e+=_0x407c74(0x256)+model+_0x407c74(0x1f2),_0x1a864e+=_0x407c74(0x20c),_0x1a864e+=_0x407c74(0x246),_0x1a864e+=_0x407c74(0x19a),_0x1a864e+=_0x407c74(0x1fe),_0x1a864e+=_0x407c74(0x1e2),_0x1a864e+=_0x407c74(0x201),_0x1a864e+=_0x407c74(0x23b),_0x1a864e+='\x09\x09data[\x27token\x27]\x20=\x20this.token;\x0d\x0a',_0x1a864e+=_0x407c74(0x21c),_0x1a864e+=_0x407c74(0x23f),_0x1a864e+=_0x407c74(0x1d2),_0x1a864e+=_0x407c74(0x194),_0x1a864e+=_0x407c74(0x1c7),_0x1a864e+=_0x407c74(0x18a),_0x1a864e+='\x09\x09data[\x27engine_version\x27]\x20=\x20this.engineVersion;\x0d\x0a',_0x1a864e+='\x09\x09data[\x27model\x27]\x20=\x20this.model;\x0d\x0a',_0x1a864e+=_0x407c74(0x1c5),_0x1a864e+=_0x407c74(0x222),_0x1a864e+='\x09\x09data[\x27kyte_iden\x27]\x20=\x20this.kyteIden;\x0d\x0a',_0x1a864e+='\x09\x09data[\x27account_id\x27]\x20=\x20this.accountId;\x0d\x0a',_0x1a864e+='\x09\x09if\x20(this.data\x20!=\x20null)\x20{\x0d\x0a',_0x1a864e+=_0x407c74(0x1da),_0x1a864e+=_0x407c74(0x246),_0x1a864e+=_0x407c74(0x1ce),_0x1a864e+=_0x407c74(0x21a),_0x1a864e+=_0x407c74(0x1ff);let _0x539ca9='',_0xfe0831='',_0x3873b6='',_0x5367da='';return modelStructure[_0x407c74(0x18c)](_0x376369=>{const _0x3abb95=_0x407c74;_0xfe0831+='\x09\x09this.'+_0x376369[_0x3abb95(0x214)]+',';let _0x5ed49e='String';if(_0x376369['type']=='i')_0x5ed49e=_0x3abb95(0x232);_0x539ca9+='\x09'+_0x5ed49e+'?\x20'+_0x376369[_0x3abb95(0x214)]+_0x3abb95(0x220),_0x3873b6+='\x09\x09'+_0x376369[_0x3abb95(0x214)]+_0x3abb95(0x25d)+_0x376369[_0x3abb95(0x214)]+_0x3abb95(0x1e1),_0x5367da+='\x09\x09data[\x27'+_0x376369[_0x3abb95(0x214)]+_0x3abb95(0x238)+_0x376369[_0x3abb95(0x214)]+_0x3abb95(0x220);}),_0x1a864e+='class\x20'+model+_0x407c74(0x20e),_0x1a864e+=_0x539ca9,_0x1a864e+=_0x407c74(0x225),_0x1a864e+=_0x407c74(0x261),_0x1a864e+=_0x407c74(0x1b8),_0x1a864e+=_0x407c74(0x226),_0x1a864e+=_0x407c74(0x25f),_0x1a864e+=_0x407c74(0x19d),_0x1a864e+='\x09String?\x20deleted_by;\x0d\x0a',_0x1a864e+=_0x407c74(0x1ad),_0x1a864e+=_0x407c74(0x1ef),_0x1a864e+='\x09'+model+'Data({\x0d\x0a',_0x1a864e+=_0xfe0831[_0x407c74(0x1d7)](/(^,)|(,$)/g,'')[_0x407c74(0x1d7)](/,/g,_0x407c74(0x205))+',\x0d\x0a',_0x1a864e+=_0x407c74(0x20d),_0x1a864e+=_0x407c74(0x247),_0x1a864e+=_0x407c74(0x24f),_0x1a864e+='\x09\x09this.date_created,\x0d\x0a',_0x1a864e+='\x09\x09this.modified_by,\x0d\x0a',_0x1a864e+=_0x407c74(0x1e4),_0x1a864e+=_0x407c74(0x24c),_0x1a864e+=_0x407c74(0x21e),_0x1a864e+=_0x407c74(0x1aa),_0x1a864e+=_0x407c74(0x188),_0x1a864e+='\x09'+model+_0x407c74(0x1f9),_0x1a864e+=_0x3873b6,_0x1a864e+=_0x407c74(0x262),_0x1a864e+='\x09\x09kyte_account\x20=\x20json[\x27kyte_account\x27];\x0d\x0a',_0x1a864e+=_0x407c74(0x1b3),_0x1a864e+=_0x407c74(0x24a),_0x1a864e+='\x09\x09modified_by\x20=\x20json[\x27modified_by\x27];\x0d\x0a',_0x1a864e+=_0x407c74(0x1f4),_0x1a864e+='\x09\x09deleted_by\x20=\x20json[\x27deleted_by\x27];\x0d\x0a',_0x1a864e+=_0x407c74(0x1bb),_0x1a864e+=_0x407c74(0x23c),_0x1a864e+=_0x407c74(0x19a),_0x1a864e+=_0x407c74(0x1fe),_0x1a864e+=_0x407c74(0x1e2),_0x1a864e+=_0x5367da,_0x1a864e+='\x09\x09data[\x27id\x27]\x20=\x20this.id;\x0d\x0a',_0x1a864e+=_0x407c74(0x22c),_0x1a864e+=_0x407c74(0x1cc),_0x1a864e+=_0x407c74(0x1a3),_0x1a864e+=_0x407c74(0x1a7),_0x1a864e+=_0x407c74(0x243),_0x1a864e+=_0x407c74(0x1c9),_0x1a864e+=_0x407c74(0x252),_0x1a864e+='\x09\x09data[\x27deleted\x27]\x20=\x20this.deleted;\x0d\x0a',_0x1a864e+='\x09\x09return\x20data;\x0d\x0a',_0x1a864e+='\x09}\x0d\x0a',_0x1a864e+=_0x407c74(0x230),_0x1a864e;}function generate_swift(_0x55f3e6){const _0x33241e=a0_0x30c1c5;let _0x246063=new Date()['toLocaleDateString']('en',{'year':'numeric','day':_0x33241e(0x1fd),'month':'2-digit'}),_0x16a55d='//\x0d\x0a//\x20'+_0x55f3e6+_0x33241e(0x22f)+_0x246063+_0x33241e(0x1a6);_0x16a55d+=_0x33241e(0x22a)+_0x55f3e6+'Data\x20:\x20Codable\x20{\x0d\x0a';let _0x268674=_0x33241e(0x192),_0x58ea1f='';return modelStructure[_0x33241e(0x18c)](_0x1595fd=>{const _0x5cb0d4=_0x33241e;_0x268674+='\x20'+_0x1595fd['name']+',';let _0x301ddf=_0x5cb0d4(0x235);if(_0x1595fd[_0x5cb0d4(0x236)]=='i')_0x301ddf=_0x5cb0d4(0x1d9);_0x58ea1f+=_0x5cb0d4(0x24d)+_0x1595fd[_0x5cb0d4(0x214)]+':\x20'+_0x301ddf+(_0x1595fd[_0x5cb0d4(0x1e7)]==0x0?'?':'')+'\x0d\x0a';}),_0x16a55d+=_0x58ea1f,_0x16a55d+=_0x33241e(0x19f),_0x16a55d+='\x09let\x20id:\x20String\x0d\x0a',_0x16a55d+=_0x33241e(0x257),_0x16a55d+=_0x33241e(0x22e),_0x16a55d+=_0x33241e(0x25c),_0x16a55d+=_0x33241e(0x191),_0x16a55d+=_0x33241e(0x1cd),_0x16a55d+=_0x33241e(0x19c),_0x16a55d+='\x09let\x20date_deleted:\x20String?\x0d\x0a',_0x16a55d+='\x09let\x20deleted:\x20String?\x0d\x0a',_0x16a55d+=_0x33241e(0x1c0),_0x16a55d+=_0x268674['replace'](/(^,)|(,$)/g,'')+'\x0d\x0a',_0x16a55d+='\x09\x09case\x20id,\x20kyte_account,\x20created_by,\x20date_created,\x20modified_by,\x20date_modified,\x20deleted_by,\x20date_deleted,\x20deleted\x0d\x0a',_0x16a55d+=_0x33241e(0x21a),_0x16a55d+=_0x33241e(0x230),_0x16a55d;}function download_code(_0x47eef2,_0x1636c3,_0x318258){const _0x59824f=a0_0x30c1c5;if(_0x318258==_0x59824f(0x1ac))alert('Feature\x20coming\x20soon!');else{blob=new Blob([universalBOM+_0x1636c3],{'type':_0x59824f(0x245)}),url=window[_0x59824f(0x1bc)]['createObjectURL'](blob),$(_0x59824f(0x23a))[_0x59824f(0x200)](_0x59824f(0x1e9));var _0xdd5c5f=document['createElement']('a');document[_0x59824f(0x197)][_0x59824f(0x1d5)](_0xdd5c5f),_0xdd5c5f[_0x59824f(0x1fb)]='display:\x20none',_0xdd5c5f[_0x59824f(0x1c6)]=url,_0xdd5c5f[_0x59824f(0x234)]=_0x47eef2+'.'+_0x318258,_0xdd5c5f[_0x59824f(0x259)](),window[_0x59824f(0x1bc)][_0x59824f(0x1ab)](url);}}function a0_0x1f32(_0x4c2dc5,_0x1ce02f){const _0x47fa15=a0_0x47fa();return a0_0x1f32=function(_0x1f32a4,_0x58e63c){_0x1f32a4=_0x1f32a4-0x186;let _0x41e94d=_0x47fa15[_0x1f32a4];if(a0_0x1f32['AzqCWt']===undefined){var _0x293509=function(_0x43a735){const _0x4a4ea9='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';let _0x4cd034='',_0x239b0f='';for(let _0x42774c=0x0,_0x54178f,_0x377f07,_0x345d11=0x0;_0x377f07=_0x43a735['charAt'](_0x345d11++);~_0x377f07&&(_0x54178f=_0x42774c%0x4?_0x54178f*0x40+_0x377f07:_0x377f07,_0x42774c++%0x4)?_0x4cd034+=String['fromCharCode'](0xff&_0x54178f>>(-0x2*_0x42774c&0x6)):0x0){_0x377f07=_0x4a4ea9['indexOf'](_0x377f07);}for(let _0x27e341=0x0,_0x53a8b3=_0x4cd034['length'];_0x27e341<_0x53a8b3;_0x27e341++){_0x239b0f+='%'+('00'+_0x4cd034['charCodeAt'](_0x27e341)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x239b0f);};a0_0x1f32['UqkNBA']=_0x293509,_0x4c2dc5=arguments,a0_0x1f32['AzqCWt']=!![];}const _0x5f001a=_0x47fa15[0x0],_0x2d6373=_0x1f32a4+_0x5f001a,_0x44d6cc=_0x4c2dc5[_0x2d6373];return!_0x44d6cc?(_0x41e94d=a0_0x1f32['UqkNBA'](_0x41e94d),_0x4c2dc5[_0x2d6373]=_0x41e94d):_0x41e94d=_0x44d6cc,_0x41e94d;},a0_0x1f32(_0x4c2dc5,_0x1ce02f);}function download_data(_0x353393){const _0x10cfe3=a0_0x30c1c5;alert(_0x10cfe3(0x228));}$(document)[a0_0x30c1c5(0x217)](function(){const _0xe72fcd=a0_0x30c1c5;$(_0xe72fcd(0x23a))['modal'](_0xe72fcd(0x193));let _0x248952=location[_0xe72fcd(0x224)];_0x248952=_0x248952==''?_0xe72fcd(0x20f):_0x248952,$(_0x248952)['removeClass'](_0xe72fcd(0x1ba)),$(_0x248952+_0xe72fcd(0x20b))['addClass'](_0xe72fcd(0x203));if(k[_0xe72fcd(0x255)]()){let _0x347b72=k['getPageRequest']();_0x347b72=_0x347b72['idx'];let _0xf05624=[{'name':_0xe72fcd(0x1df),'value':_0x347b72}];k['get'](_0xe72fcd(0x1c2),'id',_0x347b72,[],function(_0x3acce8){const _0x2c59e1=_0xe72fcd;_0x3acce8['data'][0x0]?(model=_0x3acce8[_0x2c59e1(0x1a2)][0x0][_0x2c59e1(0x214)],$('#model-name')[_0x2c59e1(0x216)](model),getData(_0x347b72,model)):$(_0x2c59e1(0x1f3))[_0x2c59e1(0x216)](_0x2c59e1(0x1dc)),$(_0x2c59e1(0x23a))[_0x2c59e1(0x200)](_0x2c59e1(0x1e9));});var _0x4640b0=new KyteTable(k,$(_0xe72fcd(0x199)),{'name':_0xe72fcd(0x241),'field':'dataModel','value':_0x347b72},colDef,!![],[0x0,'asc'],!![],!![]);_0x4640b0[_0xe72fcd(0x1ca)]();var _0x4f0c54=new KyteForm(k,$(_0xe72fcd(0x196)),'ModelAttribute',_0xf05624,elements,_0xe72fcd(0x1ed),_0x4640b0,!![],$(_0xe72fcd(0x1cf)));_0x4f0c54[_0xe72fcd(0x1ca)](),_0x4640b0['bindEdit'](_0x4f0c54),$(_0xe72fcd(0x1a4))[_0xe72fcd(0x259)](function(_0x188af6){const _0x25dbda=_0xe72fcd;_0x188af6[_0x25dbda(0x190)](),_0x188af6[_0x25dbda(0x1b5)](),download_code(model,swift,_0x25dbda(0x1d8));}),$(_0xe72fcd(0x211))[_0xe72fcd(0x259)](function(_0x284953){const _0x2a8243=_0xe72fcd;_0x284953[_0x2a8243(0x190)](),_0x284953['stopPropagation'](),download_code(model,dart,_0x2a8243(0x25a));}),$(_0xe72fcd(0x1fa))[_0xe72fcd(0x259)](function(_0x13b5a5){const _0x17392=_0xe72fcd;_0x13b5a5[_0x17392(0x190)](),_0x13b5a5[_0x17392(0x1b5)](),download_code(model,json,_0x17392(0x1ac));}),$(_0xe72fcd(0x1c8))['click'](function(_0x2d4fd1){const _0x38d70a=_0xe72fcd;_0x2d4fd1[_0x38d70a(0x190)](),_0x2d4fd1[_0x38d70a(0x1b5)](),download_data('csv');}),$(_0xe72fcd(0x265))[_0xe72fcd(0x259)](function(_0x407016){const _0x3133d9=_0xe72fcd;_0x407016['preventDefault'](),_0x407016[_0x3133d9(0x1b5)](),download_data('json');}),$(_0xe72fcd(0x1c1))[_0xe72fcd(0x259)](function(_0x28b7b0){const _0x1be0ae=_0xe72fcd;_0x28b7b0[_0x1be0ae(0x190)](),_0x28b7b0[_0x1be0ae(0x1b5)](),download_data(_0x1be0ae(0x1e5));}),$(_0xe72fcd(0x221))['click'](function(){const _0x10fd29=_0xe72fcd;$(_0x10fd29(0x221))[_0x10fd29(0x1f0)](_0x10fd29(0x203)),$(_0x10fd29(0x20f))[_0x10fd29(0x264)](_0x10fd29(0x1ba)),$(_0x10fd29(0x20a))[_0x10fd29(0x264)](_0x10fd29(0x203)),$(_0x10fd29(0x1b1))[_0x10fd29(0x1f0)](_0x10fd29(0x1ba)),$(_0x10fd29(0x223))[_0x10fd29(0x264)]('active'),$(_0x10fd29(0x1e8))['addClass'](_0x10fd29(0x1ba)),$(_0x10fd29(0x219))[_0x10fd29(0x264)](_0x10fd29(0x203)),$('#Export')[_0x10fd29(0x1f0)](_0x10fd29(0x1ba));}),$(_0xe72fcd(0x20a))[_0xe72fcd(0x259)](function(){const _0x35b5c3=_0xe72fcd;$('#Data-nav-link')[_0x35b5c3(0x1f0)]('active'),$(_0x35b5c3(0x1b1))['removeClass']('d-none'),$('#Attributes-nav-link')[_0x35b5c3(0x264)](_0x35b5c3(0x203)),$('#Attributes')[_0x35b5c3(0x1f0)](_0x35b5c3(0x1ba)),$(_0x35b5c3(0x223))[_0x35b5c3(0x264)](_0x35b5c3(0x203)),$(_0x35b5c3(0x1e8))[_0x35b5c3(0x1f0)](_0x35b5c3(0x1ba)),$(_0x35b5c3(0x219))[_0x35b5c3(0x264)](_0x35b5c3(0x203)),$(_0x35b5c3(0x1d4))['addClass']('d-none');}),$(_0xe72fcd(0x223))[_0xe72fcd(0x259)](function(){const _0x4bb845=_0xe72fcd;$(_0x4bb845(0x223))[_0x4bb845(0x1f0)]('active'),$(_0x4bb845(0x1e8))[_0x4bb845(0x264)](_0x4bb845(0x1ba)),$(_0x4bb845(0x20a))[_0x4bb845(0x264)](_0x4bb845(0x203)),$('#Data')[_0x4bb845(0x1f0)](_0x4bb845(0x1ba)),$('#Attributes-nav-link')[_0x4bb845(0x264)](_0x4bb845(0x203)),$('#Attributes')[_0x4bb845(0x1f0)](_0x4bb845(0x1ba)),$(_0x4bb845(0x219))[_0x4bb845(0x264)]('active'),$(_0x4bb845(0x1d4))['addClass'](_0x4bb845(0x1ba));}),$('#Export-nav-link')[_0xe72fcd(0x259)](function(){const _0x5600fe=_0xe72fcd;$(_0x5600fe(0x219))[_0x5600fe(0x1f0)](_0x5600fe(0x203)),$(_0x5600fe(0x1d4))[_0x5600fe(0x264)]('d-none'),$(_0x5600fe(0x20a))[_0x5600fe(0x264)](_0x5600fe(0x203)),$('#Data')[_0x5600fe(0x1f0)](_0x5600fe(0x1ba)),$('#Controllers-nav-link')['removeClass'](_0x5600fe(0x203)),$(_0x5600fe(0x1e8))[_0x5600fe(0x1f0)](_0x5600fe(0x1ba)),$(_0x5600fe(0x221))['removeClass']('active'),$(_0x5600fe(0x20f))[_0x5600fe(0x1f0)]('d-none');});}else location[_0xe72fcd(0x1c6)]=_0xe72fcd(0x1cb)+encodeURIComponent(window[_0xe72fcd(0x212)]);});