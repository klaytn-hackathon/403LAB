joinPlatform: function (_name) { //가입 버튼 js동작
    var spinner = this.showSpinner();
    const walletInstance = this.getWallet();
    if (!walletInstance) return;   //지갑 확인
    agContract.methods.joinPlatform(_name).send({ //조인 플랫폼 sol
         from : walletInstance.address,
         gas : "200000"
    }).then(function(receipt){
      if(receipt.status){
        spinner.stop();
        alert("가입 성공! : "+walletInstance.address + " : " + receipt.transactionHash);
        console.log(receipt);
      }else{
        spinner.stop();
        alert("가입 실패! : "+walletInstance.address + " : " + receipt.transactionHash);
      }
    })
  }


  //////js//////////////////////////////////////////////////////////////////////////////////////////


  submitAnswer: async function () {
    //const result = sessionStorage.getItem('result');
    //wallet주소 가져와야됨
    var name = $('#name').val();
    console.log(name);
    this.joinPlatform(name);

  }


  /////////////////////html////////가입버튼///////
  <div class="row text-center">
  <div id="game">   
    <div class="yellow-box" id="question">
      <div class="input-group">
        <input type="text" class="form-control" id="name" />
        <span class="input-group-btn">
          <button type="button" class="btn btn-default" onclick="App.submitAnswer()">제출</button>
        </span>
      </div>
    </div>     
  </div> 
</div>