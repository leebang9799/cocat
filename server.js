var http=require("http");
var express=require("express");//외부
var fs=require("fs");
var ejs=require("ejs");//외부
var bodyParser=require("body-parser");//외부
var mysql=require("mysql");//외부
var session=require("express-session");//외부
var conStr=require("./my_modules/conStr.js");

var app=express();
var server=http.createServer(app); 

//각종 미들웨어 설정 
app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());//파라미터를 json 형식으로 변환
app.use(session({
	secret:"sdfjklsadfjlksdfjlsdfsjdlf",
	resave:false, //false 권장 :세션에 변화가 있을때만 저장함
	saveUninitialized:true
}));

//mysql 접속...
var pool=mysql.createPool(conStr);

//로그인 요청 처리 
app.post("/admin/login", function(request, response){
	console.log(request.session.id);//현재 요청에 관련된 세션 객체
	console.log(request.body);

	var id=request.body.id;
	var pw=request.body.pw;
	
	pool.getConnection(function(error, con){
		if(error){
			console.log(error);
		}else{
			var sql="select * from admin where id=? and pw=?";
			con.query(sql,[id,pw], function(err, result, fields){
				if(err){
					console.log(err);
				}else{
					console.log(result);
					if(result.length==0){
						response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
						response.end("<script>alert('올바르지 않은 정보입니다');history.back();</script>");
					}else{
						//인증 결과를 세션 객체에 담아두자!! 그래야 다시 접속했을때
						//이 사람의 정보를 참조할 수 있다..
						request.session.user=id; //세션에 id 저장!!
						request.session.msg="지노 안녕";
						//로그인을 성공했으므로, 관리자 페이지로 재접속하라는
						//명령을 클라이언트의 브라우저에 하자!!
						response.redirect("/admin");
					}
				}
				con.release();//대여한 커넥션 반납!!
			});
			
		}
	});//connection 대여

});

//관리자 페이지 요청 처리 
app.get("/admin", function(request, response){
	fs.readFile("admin/index.ejs","utf-8", function(error,data){
		response.writeHead(200, {"Content-Type":"text/html;charset=utf-8"});
		response.end(ejs.render(data,{
			id:request.session.user,
			msg:request.session.msg
		}));
	});
});


server.listen(9999, function(){
	console.log("웹서버 9999포트에서 가동중...");
});









