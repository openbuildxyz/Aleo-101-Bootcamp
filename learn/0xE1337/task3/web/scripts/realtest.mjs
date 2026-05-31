import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
const API="http://localhost:3100";
const post=(p,b)=>JSON.parse(execFileSync("curl",["-s","-m","290","-X","POST",API+p,"-H","content-type: application/json","-d",JSON.stringify(b)],{encoding:"utf8",maxBuffer:1<<24}));
const get=(u)=>execFileSync("curl",["-s","-m","20",u],{encoding:"utf8"}).trim();
const code=(u)=>execFileSync("curl",["-s","-o","/dev/null","-w","%{http_code}","-m","15",u],{encoding:"utf8"}).trim();
const sleep=(s)=>execFileSync("sleep",[String(s)]);
const sha=(s)=>BigInt('0x'+crypto.createHash('sha256').update(s,'utf8').digest('hex').slice(0,62)).toString();
const ISSUER=sha("Aleo Builders DAO"), GATE=sha("VIP Lounge"), EPOCH=Math.floor(Date.now()/86400000);
const addr=JSON.parse(get(API+"/api/address")).address;
const cURL=`https://api.provable.com/v2/testnet/program/private_gate_pass.aleo/mapping/gate_access_count/${GATE}field`;
console.log("addr:",addr,"| counter BEFORE:", get(cURL));
const secret=BigInt('0x'+crypto.randomBytes(31).toString('hex')).toString();
console.log("ISSUE…");
const r1=post("/api/execute",{functionName:"issue",inputs:[addr,ISSUER+"field","3u8",(EPOCH+365)+"u32",secret+"field"]});
console.log("issue tx:", r1.txId||("ERR:"+(r1.error||"").slice(0,180)));
if(!r1.record){process.exit(1);}
console.log("waiting for issue confirm…");
let ok=false;
for(let i=0;i<18;i++){ sleep(6); if(code(`https://api.provable.com/v2/testnet/transaction/${r1.txId}`)==="200"){ok=true;console.log(`confirmed after ~${(i+1)*6}s`);break;} }
if(!ok)console.log("(issue not confirmed in 108s, trying prove anyway)");
console.log("PROVE…");
const r2=post("/api/execute",{functionName:"prove_access",inputs:[r1.record,ISSUER+"field","2u8",GATE+"field",EPOCH+"u32"]});
console.log("prove tx:", r2.txId||("ERR:"+(r2.error||"").slice(0,250)));
sleep(10);
console.log("counter AFTER:", get(cURL));
