export const PHRASES=['我是笨蛋','我是大笨蛋','我是超级大笨蛋'];

function matchesPhrase(transcript,phrase) {
  return String(transcript).normalize('NFKC').replace(/[\s\p{P}]/gu,'')===phrase;
}
// Each request owns its stream and recognizer. Closing the dialog invalidates pending permission results.
export class VoiceHint {
 constructor(index,{report,success}){
   this.phrase=PHRASES[index];
   this.report=report;this.success=success;this.closed=false;this.busy=false;
 }
 dispose(){
   this.closed=true;this.release();
 }
 release(){
   clearTimeout(this.timeout);
   if(this.rec){this.rec.onresult=this.rec.onend=this.rec.onerror=this.rec.onstart=null;try{this.rec.abort()}catch{}this.rec=null}
   this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;this.busy=false;
 }
 async listen(){
   if(this.closed||this.busy)return;
   const Rec=window.SpeechRecognition||window.webkitSpeechRecognition;
   if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){this.report('请在 HTTPS 页面上使用麦克风。',false);return}
   if(!Rec){this.report('此浏览器缺少中文语音识别。请在支持语音识别的手机浏览器中打开，提示次数已保留。',false);return}
   this.busy=true;this.report('请允许麦克风访问…',true);
   try{
     const stream=await navigator.mediaDevices.getUserMedia({audio:true});
     if(this.closed){stream.getTracks().forEach(t=>t.stop());return}
     this.stream=stream;
     // The browser recognizer opens its own microphone. Release the permission probe before dictation.
     stream.getTracks().forEach(t=>t.stop());this.stream=null;
     const rec=new Rec();this.rec=rec;rec.lang='zh-CN';rec.continuous=false;rec.interimResults=false;rec.maxAlternatives=1;
     rec.onstart=()=>this.report('正在聆听，请清楚地说出口令。',true);
     rec.onresult=e=>{
       if(this.closed||this.rec!==rec)return;
       let heardFinal=false;
       for(let i=e.resultIndex;i<e.results.length;i++){
         const result=e.results[i];
         if(!result.isFinal)continue;
         heardFinal=true;
         if(matchesPhrase(result[0].transcript,this.phrase)){
           this.dispose();
           this.success();
           return;
         }
       }
       if(heardFinal){
         this.release();
         this.report('口令未匹配，请按画面上的文字再说一次。',false);
       }
     };
     rec.onerror=e=>{if(this.closed||this.rec!==rec)return;this.release();const errors={'not-allowed':'请在浏览器中允许麦克风和语音识别，再试一次。','service-not-allowed':'当前语音识别服务不可用。','network':'语音识别服务连接失败，请检查网络后重试。','audio-capture':'麦克风不可用，请检查设备权限。','no-speech':'没有听清，请再说一次。'};this.report(errors[e.error]||'语音识别已中断，请重试。',false)};
     rec.onend=()=>{if(this.closed||this.rec!==rec)return;this.release();this.report('聆听已结束，点击麦克风可以继续。',false)};
     rec.start();this.timeout=setTimeout(()=>{if(!this.closed&&this.rec===rec){this.release();this.report('等待语音超时，请重试。',false)}},18000);
   }catch(e){if(this.closed)return;this.release();this.report(e.name==='NotAllowedError'?'需要麦克风权限才能使用提示。可在浏览器的网站设置中开启。':'未能启动麦克风或识别服务，请检查设备后重试。',false)}
 }
}
