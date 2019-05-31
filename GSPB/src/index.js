import Caver from "caver-js";
import {
  Spinner
} from "spin.js";
// import Common from "./common.js";

// const Common =

const config = {
  rpcURL: 'https://api.baobab.klaytn.net:8651'
}
const cav = new Caver(config.rpcURL);
const agContract = new cav.klay.Contract(DEPLOYED_ABI, DEPLOYED_ADDRESS); //BApp내에서 사용할 수 있는 전역 상수, 
//컨트랙 배포이후 deployedABI, deployedAddress에 저장해둔 정보를
//읽어서 전역 상수로 설정해둔다.(Webpack에서)



const App = {
  //계정 인증 정보 변수
  auth: {
    accessType: 'keystore', //인증 방식중 키스토어&비번 방식
    keystore: '', //키스토어 파일 전체 내용
    password: '' // 키스토어 비번 
  },

  ///////////////////////////////////////////////////////////////////////////////////////////////////

  ////////////// 기타 //////////////
  //페이지 로드 시 작동  
  start: async function () {    
    //모집 중인 스터디 목록
    this.setTempGroupList();

    //start함수 : 세션을 통해 인증 받은 적 있는지 체크
    const walletFromSession = sessionStorage.getItem('walletInstance');
    if (walletFromSession) { //월렛 정보가 있을때 실행
      try {
        cav.klay.accounts.wallet.add(JSON.parse(walletFromSession)); //cav에 저장된 지갑 정보 추가
        this.changeUI(JSON.parse(walletFromSession)); //로그인 된 UI로 변경
        
      } catch (e) { //세션에 있는 인스턴스가 유효한 지갑 정보가 아닐경우
        sessionStorage.removeItem('walletInstance'); //세션 값 삭제
      }
    }
  },
  //계정 지갑 인스턴스 반환 //cav.js에 등록된 계정이 있으면 가져온다.
  getWallet: function () {
    if (cav.klay.accounts.wallet.length) { //로그인 된 계정이 있다면
      return cav.klay.accounts.wallet[0]; //계정의 첫번째값 로그인된 계정을 불러온다.
    }
  },
  //스피너 보여주기
  showSpinner: function () {
    var tartget = document.getElementById("spin");
    return new Spinner(opts).spin(tartget); //스피너 인스턴스 가져와 리턴
  },
  //////////////////////////////////



  //////// 로그인 모달 관련 ////////
  //KeyStore 업로드시 작동
  handleImport: async function () {
    const fileReader = new FileReader(); //FileReader() 의 대소문자 구별 주의
    fileReader.readAsText(event.target.files[0]);
    fileReader.onload = (event) => {
      try {
        if (!this.checkValidKeystore(event.target.result)) { //가져온 keystore파일이 유요한지 검사
          $('#message').text('유효하지 않은 keystore 파일입니다.'); //유효하지 않으면 오류 메시지 이후 종료
          return;
        }
        this.auth.keystore = event.target.result;
        $('#message').text('keystore 통과. 비밀번호를 입력하세요'); //유효하지 않으면 오류 메시지 이후 종료
        document.querySelector('#input-password').focus(); //인증되면 비번 입력창으로 보내기
      } catch (event) {
        //에러 발생시 문제 알리기
        $('#message').text('유효하지 않은 keystore 파일입니다.'); //유효하지 않으면 오류 메시지 이후 종료
        return;
      }
    }
  },
  //KeyStore 변조 여부체크
  checkValidKeystore: function (keystore) {
    //넘어온 keystore(json파일)을 체크
    const parsedKeystore = JSON.parse(keystore); //json파일을 JS에서 사용하기 편리하게 오브젝트로 분해

    //4가지가 항상 있어야한다.
    //4가지를 &&(and)연산을 통해서 모두 존재해 참인지 검사
    const isValidKeystore = parsedKeystore.version &&
      parsedKeystore.id &&
      parsedKeystore.address &&
      parsedKeystore.crypto;
    return isValidKeystore;

  },
  //비밀번호 auth 구조체에 저장 
  //onchange에 함수로 등록 되어 비밀번호 입력 항목에 변화 생길때 마다 호출 됨
  handlePassword: async function () {
    this.auth.password = event.target.value; //html에서 호출하면 내용 password에 저장
  },
  //로그인 모달 최종 제출 버튼 동작
  handleLogin: async function () {
    if (this.auth.accessType === 'keystore') { //if를 사용한 이유는 나중에 Privatekey방식도 구현할 수 있게끔 만드려고
      try { //키스토어와 비밀번호로는 PrivateKey를 얻을 수 있다. 이 PrivateKey를 통해 Wallet 인스턴스 생성 가능
        const privateKey = cav.klay.accounts.decrypt(this.auth.keystore, this.auth.password).privateKey; //cav인스턴스의 어카운트의 디크립트를 통해 키스토어와 비밀번호로 해독해 여러 멤버를 불러올 수 있고, 이때 privateKey를 사용한다.
        this.integrateWallet(privateKey); //비밀키를 가지고 함수를 실행시킨다.
      } catch (e) {
        $('#message').text('비밀번호가 일치하지 않습니다.'); //위 함수중 비밀번호나 키스토어가 이상하다면 에러가 발생한다.
      }
    }
  },
  //최초 로그인 시 cav.js 및 세션에 지갑 정보 저장
  integrateWallet: function (privateKey) {
    //월렛 인스턴스를 가져오는 함수
    const walletInstance = cav.klay.accounts.privateKeyToAccount(privateKey); //월렛 정보들을 담고 있는 월렛 인스턴스 생성
    cav.klay.accounts.wallet.add(walletInstance); // cav월렛에 월렛인스턴스를 추가해놓으면 TX처리시 cav를 통해 불러서 처리하기에 편리하게 처리 가능

    //월렛 정보 세션에 저장, 탭이 닫히거나 웹브라우저 종료시까지 브라우저에 정보 보관가능
    sessionStorage.setItem('walletInstance', JSON.stringify(walletInstance)); // 세션에 setItem으로 정보 보관시, key-value로 넣는다. 첫 인자가 key , 두 번째 인자가 value   
    //세션에 저장해 두면 세션 내부에 저장된 정보를 통해 로그인을 유지할 수 있다.

    this.isJoin();//가입 여부 호출
  },
  //컨트랙에 가입 여부 확인, 미 가입시 가입 모달 표시, 기 가입시 changeUI로 로그인된 UI로 변경
  isJoin: function () {
    var spinner = this.showSpinner();
    const walletInstance = this.getWallet();
    if (!walletInstance) return;

    agContract.methods.isJoinCheck().send({
      from: walletInstance.address,
      gas: "200000"
    })
    .once('receipt', (receipt) => { //영수증 받아오기
      if (receipt.status) {
        console.log('없었음')
        //기존에 없음
        spinner.stop();
        $('#spin').hide();

        //이름 입력 받기 위한 모달 구성
        $('#loginModal').modal('hide'); //우선 로그인을 하려한 modal을 닫고
        $('#signupModal').modal('show');      
      }
    })
    .once('error', (error) => {
      console.log('있었음');
      //기존에 있음
      $('#spin').hide();
      spinner.stop();
      this.changeUI(walletInstance);
    });
  },
  //가입 시도 모달에서 제출 버튼 동작
  submitAnswer: async function () {
    //const result = sessionStorage.getItem('result');
    //wallet주소 가져와야됨
    var name = $('#name').val();
    console.log(name);
    this.joinPlatform(name);
  },
  //컨트랙에 가입 시도
  joinPlatform: function (_name) {
    $('#spin').show();
    var spinner = this.showSpinner();
    const walletInstance = this.getWallet();
    if (!walletInstance) return;
    agContract.methods.joinPlatform(_name).send({
      from: walletInstance.address,
      gas: "200000"
    }).then(async function (receipt) {
      if (receipt.status) {
        spinner.stop();
        $('#spin').hide();
        var recvData = await App.setName(walletInstance.address, _name);
        if(recvData.data)
         alert("가입 성공! : " + walletInstance.address + " : " + receipt.transactionHash);
        else
          alert("가입 불가능한 스터디 입니다.")
        console.log(receipt);
        //가입 성공하면 로그인후 새로고침
        location.reload();
      } else {
        spinner.stop();        
        alert("가입 실패! : " + walletInstance.address + " : " + receipt.transactionHash);
        this.removeWallet(); // 이 함수를 통해 Wallet 인스턴스를 초기화하고 세션 스토리지도 클리어
        //페이지 새로고침 코드, 처음 UI로 돌아가기 위해 사용
        location.reload();
      }
    })
  },
  ///////////// 로그인 모달 관련 끝/////////////////////



  //////// 로그아웃 관련 ////////
  //로그아웃 버튼 동작
  handleLogout: async function () {
    this.removeWallet(); // 이 함수를 통해 Wallet 인스턴스를 초기화하고 세션 스토리지도 클리어

    //페이지 새로고침 코드, 처음 UI로 돌아가기 위해 사용
    location.reload();
  }, 
  //지갑 정보 삭제 // cav.js, 세션에 저장된 지갑 정보 제거
  removeWallet: function () {
    cav.klay.accounts.wallet.clear(); //cav에 등록되었던 지갑정보 초기화
    sessionStorage.removeItem('walletInstance') //세션의 키값을 이용해서 해당 값 삭제
    this.reset(); // 리셋함수 호출
  }, 
  //auth 변수 초기화
  reset: function () {
    //auth 변수를 초기화 해주면 된다.
    this.auth = {
      keystore: '',
      password: ''
    }; // 엑세스 타입도 초기화 해야하지만, 현재 계속 keystore방식이라 초기화x
  },
  //////////로그아웃 관련 끝////////////////



  /////////// UI 변경 관련 ////////////
  //로그인 상태 UI 변경
  changeUI: async function (walletInstance) {
    $('#loginModal').modal('hide'); //우선 로그인을 하려한 modal을 닫고
    $('#login').hide(); //로그인 버튼 숨기고

    $('#user').show(); //유저 버튼 공개
    $('#logout').show(); //로그아웃 버튼 공개
    $('#navbarDropdown').show(); //내 스터디 목록 공개

    this.setUserStudyList(); //nav바의 참여 스터디 목록 추가
  },
  //상단바 스터디 목록 추가 // (완료)
  setUserStudyList: async function(){
    const address = this.getWallet().address;
    var userConfirmGroupList = await this.getUserConfirmGroupList(address);
    for ( var k in userConfirmGroupList)
    {
      $('#nav-study-list')
          .append(
            '<button class="dropdown-item" onclick="App.moveGroupPage('+userConfirmGroupList[k].id+')">'
            + userConfirmGroupList[k].studyName +
            '</button>'
          );
    }
  },
  //시작 화면 모집 중인 스터디 카드 구성 (완성)
  setTempGroupList: async function () {
    var recvData = await this.getTempGroupList();
    for(var i = 0 ; i < recvData.length ; ++i)
    { 
        $('#simpleGroupIntro')
        .append(
          '<div class="col-md-4">\
            <div class="card mb-4 shadow-sm ">\
              <div class="card-body">\
                <h5 class="card-title">' + recvData[i].studyName + '</h5> \
                <p class="card-text">' + recvData[i].studyGoal + '</p>\
                <p class="card-text">' + recvData[i].studyIntro + '</p>\
                <p class="card-text">참가 조건 : 평점 ' + recvData[i].studentLimit + '이상</p>\
                <div class="d-flex justify-content-between align-items-center">  \
                  <small class="text-muted">모집 기간<br/>' + recvData[i].studySt.split("T")[0] + ' ~ ' + recvData[i].studyEd.split("T")[0] + '</small>\
                  <button type="button" class="btn btn-sm btn-outline-secondary" \
                  id="groupJoinBtn" onclick="App.joinGroup('+ recvData[i].id +')">참가하기</button>\
                </div>\
              </div>\
            </div>\
          </div>'        
        );
    };
  },
  ////////////UI 변경 관련 끝//////////////




  ////////////동작 관련//////////////////////////////////////////
  //임시 그룹 가입 대기 동작(완성)
  joinGroup: async function (num) {
    var groupIndex = num;
    var address = this.getWallet().address;

    var recvData = await this.joinTempGroup(address, groupIndex);

    if(recvData.data)
      alert("참여성공 클레이를 지불하세요")
    else
      alert("가입 불가능한 스터디 입니다.")
  },
  //스터디 그룹용 페이지로 이동
  moveGroupPage: function(id) {
    sessionStorage.setItem('groupId', id);
    location.href="/studyGroup.html";
  },


 ////////////동작 관련 끝//////////////////////////////////////////




  ////////////데이터 관련//////////////////////////////////////////

  //모집 중인 전체 스터디 JSON 반환 (반환값 : id, studyName, studyGoal, studyIntro, studySt, studyEd, studentLimit) // (완성)
  getTempGroupList: async function () {
    var url = 'http://mijuhome.iptime.org:5333/';
    var methods = 'getTempGroupList';
    var query = '';

    var recvData;
    await $.get(url + methods + query, function(data){
      recvData = JSON.parse(data);
    })
    return recvData;
  },
  //사용자의 참여 확정 목록 JSON 반환 (반환값 : id, studyName, studyGoal) // (완성)
  getUserConfirmGroupList: async function (address) {
    var url = 'http://mijuhome.iptime.org:5333/';
    var methods = 'getUserConfirmGroupList';
    var sendArray = {};
    sendArray['userAddress'] = address;
    var sendData = JSON.stringify(sendArray);
    var recvData;
    await $.post(url + methods, {'data' : sendData }, function(data){
      recvData = JSON.parse(data);
    });
    return recvData;
  },
  //임시 그룹 가입 요청 보내기 (완성)
  joinTempGroup: async function (userAddress, groupid){
    var url = 'http://mijuhome.iptime.org:5333/';
    var methods = 'joinTempGroup';
    var sendArray = {};
    sendArray['userAddress'] = userAddress;
    sendArray['groupid'] = groupid;
    var sendData = JSON.stringify(sendArray);
    var recvData;
    await $.post(url + methods, {'data' : sendData }, function(data){
      recvData = JSON.parse(data);
    });
    return recvData;
  },
  //이름
  setName: async function (address, name){
    var url = 'http://mijuhome.iptime.org:5333/';
    var methods = 'setName';
    var sendArray = {};
    sendArray['address'] = address;
    sendArray['name'] = name;
    var sendData = JSON.stringify(sendArray);
    var recvData;
    await $.post(url + methods, {'data' : sendData }, function(data){
      recvData = JSON.parse(data);
    });
    return recvData;
  }
 ////////////데이터 관련 끝//////////////////////////////////////////

  




  // //덧셈 게임 관련 항목
  // generateNumbers: async function () {
  //   var num1 = Math.floor((Math.random() * 50) + 10); //최소 10 ~ 59까지의 랜덤수 출력    
  //   //random() : 0~1사이 숫자 랜덤 출력
  //   var num2 = Math.floor((Math.random() * 50) + 10); //최소 10 ~ 59까지의 랜덤수 출력   

  //   //두 랜덤 수의 세션에 정답 저장
  //   sessionStorage.setItem('result', num1 + num2);

  //   //시작버튼 숨기기
  //   $('#start').hide();

  //   //문제관련 보이기
  //   $('#num1').text(num1);
  //   $('#num2').text(num2);
  //   $('#question').show();

  //   //바로 정답 입력하게 포커스 정답입력칸으로 변경
  //   document.querySelector('#answer').focus();

  //   //문제 시작과 동시에 타이머 작동
  //   this.showTimer();
  // },
  // submitAnswer: async function () {
  //   const result = sessionStorage.getItem('result'); //세션에 저장해둔 정답 불러오기
  //   var answer = $('#answer').val(); //제출한 정답 가져오기
  //   if (answer === result) {
  //     if (confirm("대단하네요 ^^ 0.1 KLAY 받기")) {
  //       if (await this.callContractBalance() >= 0.1) {
  //         this.receiveKlay();
  //       } else {
  //         alert("죄송합니다. 컨트랙의 KLAY가 다 소모되었습니다.");
  //       }
  //     }
  //   } else {
  //     alert("땡! 초등학생도 하는데 ㅠㅠ");
  //   }

  // },
  // deposit: async function () {
  //   var spinner = this.showSpinner(); //스피너 시작

  //   //무조건 owner만 보낼 수 있어야 한다.(주최자)
  //   //주최자가 맞다면 배포한 컨트렉(AdditionGame.sol)의 deposit()함수에 접근해 송금

  //   //우선 배포한 컨트렉의 인스턴스 생성 --> 상수로 처리

  //   //로그인된 계정이 관리 계정인지 확인
  //   //로그인된 계정 부르고, 관리 계정 정보 부르기

  //   const walletInstance = this.getWallet(); //로그인된 계정 정보 호출
  //   if (walletInstance) {
  //     if (await this.callOwner() !== walletInstance.address) return; //일치하지 않으면 함수 종료
  //     else { //일치한다면
  //       var amount = $('#amount').val(); //보낼 값을 HTML에서 가져온다.
  //       if (amount) { //보낼 값이 있다면
  //         agContract.methods.deposit().send({ //컨트렉에 존재하는 deposit()함수에 내용을 보낸다
  //             //send의 인자로 TX인자를 보내야한다.
  //             from: walletInstance.address, //누가 함수 호출하는가 //walletInstance.address의 경우 인증 완료된 계정이라 서명 가능(BApp내에서 주소 인증된 값만 사용가능)
  //             gas: '250000', //사용될 가스?
  //             value: cav.utils.toPeb(amount, "KLAY") //payalbe이라 무조건 value값 필요 //html의 amount에서 받아온 klay단위를 peb로 변환 필요
  //           })
  //           .once('transactionHash', (txHash) => { //비동기 방식으로 정보를 받아올 수 잇다.
  //             console.log(`txHash: ${txHash}`); //해당 동작의 TX를 받아와 console에 출력
  //           })
  //           .once('receipt', (receipt) => { //영수증 받아오기
  //             console.log(`(#${receipt.blockNumber})`, receipt); //영수증 출력시 블록에 추가 가능, 따라서 블록 확인가능

  //             //송금 성고시 스피너 스톱
  //             spinner.stop();

  //             alert(amount + " 1KLAY를 컨트랙에 송금했습니다."); //컨트랙 송금 완료를 알리고
  //             location.reload(); //페이지를 새로고침해 컨트랙의 klay잔액을 보여준다.
  //             //잔액을 보여줄때 컨트랙의 getBalance()함수를 이용해서 보여준다.
  //             //새로고침시 잔액을 표시할 수 있게 처음 호출되는 start()함수에서 changeUI함수 호출하니 changeUI를 변경시킨다.

  //             //새로고침까지 TX송금 기다리며 보여줄 로드스피너 추가(권장사항)
  //           })
  //           .once('error', (error) => {
  //             alert(error.message); //TX기록 실패시 원인 알려줌
  //           });
  //       }
  //       return; //amount가 없으면 그냥 종료
  //     }
  //   }
  // },

  // //컨트렉의 owner값 받아오기
  // callOwner: async function () {
  //   return await agContract.methods.owner().call(); //생성해둔 컨트랙에 접속해 owner값 획득
  //   //await를 사용해 비동기로 받는다.
  // },

  // //컨트랙의 잔액 가져오기
  // callContractBalance: async function () {
  //   return await agContract.methods.getBalance().call(); //컨트랙의 메소드를 이용해 잔액가져옴
  // },
  
  // //시간 화면 돌리기
  // showTimer: function () {
  //   //인터벌함수를 통해 3초를 타이머 제고, 지나면 시작화면으로 돌리기
  //   var seconds = 3;
  //   $('#timer').text(seconds);

  //   var interval = setInterval(() => {
  //     $('#timer').text(--seconds);
  //     if (seconds <= 0) { //0이되면 초기화        
  //       $('#timer').text(''); //타이머 부분 초기화
  //       $('#answer').val(''); //답 부분 초기화

  //       $('#question').hide(); //문제 안보이게 설정
  //       $('#start').show(); //시작 버튼 보이게 설정

  //       clearInterval(interval); //인터벌 종료
  //     }
  //   }, 1000); //1초에 1번 호출
  // },
  // //클레이 받기 버튼 동작
  // receiveKlay: function () {
  //   var spinner = this.showSpinner(); //스피너 사용
  //   const walletInstance = this.getWallet(); //저장된 Wallet 인스턴스 가져오기

  //   if (!walletInstance) return; //지갑 인스턴스 없을 경우 종료


  //   agContract.methods.transfer(cav.utils.toPeb("0.1", "KLAY")).send({ //KLAY를 PEB로 변환해서 인자로 넘겨야 한다.
  //     from: walletInstance.address, //인증된 지갑 주소 넘기기
  //     gas: '250000' //가스 최대 소모? 설정
  //     //payable이 아니라 value가 필요 없다.
  //   }).then(function (receipt) { //송금확인을 비동기를 기다려서 하는 방법도 있다.
  //     if (receipt.status) { //receipt의 결과가 true면 성공
  //       spinner.stop(); // 스피너 멈추기
  //       alert("0.1 KLAY가 " + walletInstance.address + " 계정으로 지급되었습니다.");
  //       // console.log(receipt.txHash);
  //       // console.log(receipt.transactionHash); //txHash에서 transactionHash로 변경됨

  //       //스코프에서 바로 확인할 수 있게 HTML에서 링크 생성
  //       $('#transaction').html(""); //TX div를 클리어 //매번 새로운 링크를 위해 일단 없앤다.
  //       $('#transaction')
  //         .append(`<p><a href='https://baobab.klaytnscope.com/tx/${receipt.transactionHash}'
  //                     target='_blank'>클레이튼 Scope에서 트랜젝션 확인</a></p>`);
  //       //receipt.txHash를 URL의 파라미터로 넣어서 주소로 연결되게 만듬

  //       return agContract.methods.getBalance().call() //컨트랙의 잔액을 불러온다.
  //         .then(function (balance) {
  //           $('#contractBalance').html(""); //잔액 클리어
  //           $('#contractBalance')
  //             .append('<p>' + '이벤트 잔액: ' + cav.utils.fromPeb(balance, "KLAY") + ' KLAY' + '</p>')
  //         })
  //     }
  //   })
  // },
};



//////////////////////////////////////////////////////////////////////////////////////////

window.App = App;
window.addEventListener("load", function () {
  App.start();
});
var opts = {
  lines: 10, // The number of lines to draw
  length: 30, // The length of each line
  width: 17, // The line thickness
  radius: 45, // The radius of the inner circle
  scale: 1, // Scales overall size of the spinner
  corners: 1, // Corner roundness (0..1)
  color: '#5bc0de', // CSS color or array of colors
  fadeColor: 'transparent', // CSS color or array of colors
  speed: 1, // Rounds per second
  rotate: 0, // The rotation offset
  animation: 'spinner-line-fade-quick', // The CSS animation name for the lines
  direction: 1, // 1: clockwise, -1: counterclockwise
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  className: 'spinner', // The CSS class to assign to the spinner
  top: '50%', // Top position relative to parent
  left: '50%', // Left position relative to parent
  shadow: '0 0 1px transparent', // Box-shadow for the lines
  position: 'absolute' // Element positioning
};