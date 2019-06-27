var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var cors = require('cors');
const port = 5333;

//post의 받은 데이터 확인을 위한 처리
app.use(express.json());
app.use(bodyParser.urlencoded({
  extended: true
}))

// CORS 설정
app.use(cors());

//DB 연동
var mysql = require('mysql');
var db_config = require('./config/db-config.json');
global.connection = mysql.createConnection(db_config);
handleDisconnect(global.connection);

function handleDisconnect(client) {
  client.on('error', function (error) {

    if (!error.fatal) return;

    if (error.code !== 'PROTOCOL_CONNECTION_LOST') throw err;



    console.error('> Re-connecting lost MySQL connection: ' + error.stack);

    global.connection = mysql.createConnection(db_config);

    handleDisconnect(global.connection);

    global.connection.connect();

  });
};


//REST API 처리 목록 (나중에 겹치는 것 통합할 수 있음, 함수에서 methods변수를 통해 if-else로 처리)

////index.js//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//전체 모집 중인 스터디 목록 반환(반환값 id, studyName, studyGoal,  studyIntro, studySt, studyEd) // (완성)
app.get('/getTempGroupList', function (req, res) {
  console.log("CALL : " + "getTempGroupList" + "API\n");
  connection.query('SELECT id, studyName, studyGoal, studyIntro, studySt, studyEd, studentLimit FROM `Klaytn-DB`.tempGroup WHERE contractIndex IS NULL;',
    function (err, rows, fields) {
      if (!err) {
        console.log("COMPLET : getTempGroupList API\n");
        res.send(JSON.stringify(rows));
      } else
        console.log('\nError while performing Query.', err);
    });
});

//자신의 참여 스터디 목록 반환(반환값 id, 이름) //(완성)
app.post('/getUserConfirmGroupList', function (req, res) {
  var functionName = 'getUserConfirmGroupList';
  console.log("CALL : " + functionName + " API\n");

  var data = JSON.parse(req.body.data);
  var address = data.userAddress;
  var query = "SELECT id, studyName, studyGoal FROM `Klaytn-DB`.tempGroup	WHERE(id in (SELECT groupid FROM `Klaytn-DB`.userGroupList WHERE userAddress= ? and paymentStatus=1 ) and contractIndex IS NOT NULL and contractLive = 1);";
  var params = [address];

  connection.query(query, params, function (err, rows, fields) {
    if (!err) {
      console.log("COMPLETE : " + functionName + " API\n");
      res.json(JSON.stringify(rows));
    } else
      console.log('\nError while performing Query.', err);
  });
});

//그룹 스터디 임시 가입 버튼 동작 (미완) : 중복 가입 방지
app.post('/joinTempGroup', function (req, res) {
  var functionName = 'joinTempGroup';
  console.log("CALL : " + functionName + " API");

  var data = JSON.parse(req.body.data);
  var query = "INSERT INTO `Klaytn-DB`.`userGroupList` (`userAddress`, `groupid`) SELECT ?,? WHERE (SELECT contractIndex FROM `Klaytn-DB`.tempGroup WHERE id=?) IS NULL AND NOT EXISTS(SELECT * FROM `Klaytn-DB`.userGroupList WHERE userAddress = ? AND groupid = ?);";
  var params = [data.userAddress, data.groupid, data.groupid, data.userAddress, data.groupid];

  connection.query(query, params, function (err, rows, fields) {
    if (!err) {
      if (rows.insertId !== 0)
        res.json(JSON.stringify({
          data: true
        }));
      else
        res.json(JSON.stringify({
          data: false
        }));
      console.log("COMPLETE : " + functionName + " API\n");
    } else {
      res.json(JSON.stringify({
        data: false
      }));
      console.log('Error while performing Query.', err);
    }
  });

});

//그룹 스터디 임시 가입 버튼 동작 (미완) : 중복 가입 방지
app.post('/setName', function (req, res) {
  var functionName = 'setName';
  console.log("CALL : " + functionName + " API");

  var data = JSON.parse(req.body.data);
  var query = "INSERT INTO `Klaytn-DB`.`userName` (`userAddress`, `userName`) VALUES (?,?); ";
  var params = [data.address, data.name];

  connection.query(query, params, function (err, rows, fields) {
    if (!err) {
      console.log(rows);
      if (rows.insertId !== 0)
        res.json(JSON.stringify({
          data: true
        }));
      else
        res.json(JSON.stringify({
          data: false
        }));
      console.log("COMPLETE : " + functionName + " API\n");
    } else {
      res.json(JSON.stringify({
        data: false
      }));
      console.log('Error while performing Query.', err);
    }
  });

});
app.post('/getName', function (req, res) {
  var functionName = 'getName';
  console.log("CALL : " + functionName + " API");

  var data = JSON.parse(req.body.data);
  var query = "SELECT userName FROM `Klaytn-DB`.userName WHERE userAddress=?;";
  var params = [data.address];


  connection.query(query, params, function (err, rows, fields) {
    if (!err) {
      console.log("COMPLETE : " + functionName + " API\n");
      res.json(JSON.stringify(rows));
    } else
      console.log('\nError while performing Query.', err);
  });

});
////index.js 끝//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


////createGroup.js//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//임시 그룹 스터디 DB에 저장
app.post('/sendCreateTempGroup', function (req, res) {
  var functionName = 'sendCreateTempGroup';
  console.log("CALL : " + functionName + " API");

  var data = JSON.parse(req.body.data);
  var query = "INSERT INTO `Klaytn-DB`.`tempGroup` (`studyName`, `studyGoal`, `studyIntro`, `studySt`, `studyEd`, `studentLimit`, `groupOwner`) VALUES (?,?,?,?,?,?,?);"
  var params = data;
  var params = [data.studyName, data.studyGoal, data.studyIntro, data.studySt, data.studyEd, data.studentLimit, data.ownerAddress];

  connection.query(query, params, function (err, rows, fields) {
    if (!err) {
      if (rows.insertId !== 0) {
        console.log("CALL : " + functionName + " 2 " + "API");
        var address = data.ownerAddress;
        var groupid = rows.insertId;
        var query2 = "INSERT INTO `Klaytn-DB`.`userGroupList` (`userAddress`, `groupid`) VALUES (?, ?);";
        var params2 = [address, groupid];

        connection.query(query2, params2, function (err, rows, fields) {
          if (!err) {
            console.log(rows);
            if (rows.insertId !== 0) {
              res.json(JSON.stringify({
                data: true
              }));
            } else
              res.json(JSON.stringify({
                data: false
              }));
            console.log("COMPLETE : " + functionName + " 2 API\n");
          } else {
            res.json(JSON.stringify({
              data: false
            }));
            console.log('Error while performing Query.', err);
          }
        });
      } else
        res.json(JSON.stringify({
          data: false
        }));
      console.log("COMPLETE : " + functionName + " API\n");
    } else {
      res.json(JSON.stringify({
        data: false
      }));
      console.log('Error while performing Query.', err);
    }
  });










  // connection.query(query, function(err, rows, fields) {
  //   if (!err)
  //   {
  //     console.log("CALL : " + "createTempGroup2" + "API");
  //     var address = data.ownerAddress;
  //     var groupid = rows.insertId;
  //     var query2 = "INSERT INTO `Klaytn-DB`.`userGroupList` (`userAddress`, `groupid`, `paymentStatus`) VALUES ('"
  //           + address + "', '" +
  //           + groupid + "', '');";
  //     connection.query(query2, function(err, rows) {
  //       if(err) throw err;
  //       else{
  //         console.log("야 됬어!");
  //         res.json( JSON.stringify({ data: true }) );
  //       }
  //     });
  //   }
  //   else
  //     console.log('Error while performing Query.', err);
  // });

});
////createGroup.js 끝//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



////userPage.js //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//자신의 임시 스터디 목록 반환(반환값 id, 이름) //(완성)
app.post('/getUserTempGroupList', function (req, res) {
  var functionName = 'getUserTempGroupList';
  console.log("CALL : " + functionName + " API\n");

  var data = JSON.parse(req.body.data);
  var address = data.userAddress;
  var query = "SELECT id, studyName, studyGoal FROM `Klaytn-DB`.tempGroup	WHERE(id in (SELECT groupid FROM `Klaytn-DB`.userGroupList WHERE userAddress= ?) and contractIndex IS NULL);";
  var params = [address];

  connection.query(query, params, function (err, rows, fields) {
    if (!err) {
      console.log("COMPLETE : " + functionName + " API\n");
      res.json(JSON.stringify(rows));
    } else
      console.log('\nError while performing Query.', err);
  });
});
//자신의 참여 스터디 목록 반환(반환값 id, 이름) //(완성)
app.post('/getUserHoldGroupList', function (req, res) {
  var functionName = 'getUserHoldGroupList';
  console.log("CALL : " + functionName + " API\n");

  var data = JSON.parse(req.body.data);
  var address = data.userAddress;
  var query = "SELECT id, studyName, studyGoal FROM `Klaytn-DB`.tempGroup	WHERE(id in (SELECT groupid FROM `Klaytn-DB`.userGroupList WHERE userAddress= ? and paymentStatus=0 ) and contractIndex IS NOT NULL);";
  var params = [address];

  connection.query(query, params, function (err, rows, fields) {
    if (!err) {
      console.log("COMPLETE : " + functionName + " API\n");
      res.json(JSON.stringify(rows));
    } else
      console.log('\nError while performing Query.', err);
  });
});

//자신이 생성한 임시 스터디 목록 반환
app.post('/getCreateTempGroupList', function (req, res) {
  var functionName = 'getCreateTempGroupList';
  console.log("CALL : " + functionName + " API\n");

  var data = JSON.parse(req.body.data);
  var address = data.userAddress;
  var query = "SELECT id, studyName, studyGoal, studentLimit FROM `Klaytn-DB`.tempGroup	WHERE(groupOwner = ? and contractIndex IS NULL);";
  var params = [address];

  connection.query(query, params, function (err, rows, fields) {
    if (!err) {
      console.log("COMPLETE : " + functionName + " API\n");
      res.json(JSON.stringify(rows));
    } else
      console.log('\nError while performing Query.', err);
  });
});
//자신이 생성한 진행 스터디 목록 반환
app.post('/getCreateConfirmGroupList', function (req, res) {
  var functionName = 'getCreateConfirmGroupList';
  console.log("CALL : " + functionName + " API\n");

  var data = JSON.parse(req.body.data);
  var address = data.userAddress;
  var query = "SELECT id, studyName, studyGoal FROM `Klaytn-DB`.tempGroup	WHERE(groupOwner = ? and contractIndex IS NOT NULL and contractLive = 1);";
  var params = [address];

  connection.query(query, params, function (err, rows, fields) {
    if (!err) {
      console.log("COMPLETE : " + functionName + " API\n");
      res.json(JSON.stringify(rows));
    } else
      console.log('\nError while performing Query.', err);
  });
});

//스터디의 참여 학생 목록 반환
app.post('/getTempGroupStudentList', function (req, res) {
  var functionName = 'getTempGroupStudentList';
  console.log("CALL : " + functionName + " API\n");

  var data = JSON.parse(req.body.data);
  var groupid = data.groupid;
  var query = "SELECT userAddress FROM `Klaytn-DB`.userGroupList	WHERE groupid = ?;";
  var params = [groupid];

  connection.query(query, params, function (err, rows, fields) {
    if (!err) {
      console.log("COMPLETE : " + functionName + " API\n");
      res.json(JSON.stringify(rows));
    } else
      console.log('\nError while performing Query.', err);
  });
});
//컨트랙에 등록된 값으로 contractIndex 업데이트
app.post('/setContractIndex', function (req, res) {
  var functionName = 'setContractIndex';
  console.log("CALL : " + functionName + " API");

  var data = JSON.parse(req.body.data);
  var query = "UPDATE `Klaytn-DB`.`tempGroup` SET `contractIndex` = ? WHERE (`id` = ?);";
  var params = [data.groupIndex, data.groupid];

  connection.query(query, params, function (err, rows, fields) {
    if (!err) {
      if (rows.changedRows !== 0)
        res.json(JSON.stringify({
          data: true
        }));
      else
        res.json(JSON.stringify({
          data: false
        }));
      console.log("COMPLETE : " + functionName + " API\n");
    } else {
      res.json(JSON.stringify({
        data: false
      }));
      console.log('Error while performing Query.', err);
    }
  });
});

//유저의 스터디 목록의 paymentStatus를 1로 업데이트
app.post('/setPaymentStatus', function (req, res) {
  var functionName = 'setPaymentStatus';
  console.log("CALL : " + functionName + " API");
  var data = JSON.parse(req.body.data);
  var query = "SELECT id FROM `Klaytn-DB`.userGroupList WHERE userAddress=? AND groupid = ?;";
  var params = [data.address, data.id];

  connection.query(query, params, function (err, rows, fields) {
    if (!err) {
      console.log(rows);
      var query2 = "UPDATE `Klaytn-DB`.`userGroupList` SET `paymentStatus` = '1' WHERE (`id` = ?);";
      var params2 = [rows[0].id];


      connection.query(query2, params2, function (err, rows, fields) {
        if (!err) {
          if (rows.changedRows !== 0)
            res.json(JSON.stringify({
              data: true
            }));
          else
            res.json(JSON.stringify({
              data: false
            }));
          console.log("COMPLETE : " + functionName + " API\n");
        } else {
          res.json(JSON.stringify({
            data: false
          }));
          console.log('Error while performing Query.', err);
        }
      });
    } else {
      res.json(JSON.stringify({
        data: false
      }));
      console.log('Error while performing Query.', err);
    }
  });



});

  
app.post('/setContractLive', function (req, res) {
  var functionName = 'setContractLive';
  console.log("CALL : " + functionName + " API");

  var data = JSON.parse(req.body.data);
  var query = "UPDATE `Klaytn-DB`.`tempGroup` SET `contractLive` = 0 WHERE (`id` = ?);";
  var params = [data.id];

  connection.query(query, params, function (err, rows, fields) {
    console.log(rows);
    if (!err) {
      if (rows.changedRows !== 0)
        res.json(JSON.stringify({
          data: true
        }));
      else
        res.json(JSON.stringify({
          data: false
        }));
      console.log("COMPLETE : " + functionName + " API\n");
    } else {
      res.json(JSON.stringify({
        data: false
      }));
      console.log('Error while performing Query.', err);
    }
  });
});
////userPage.js 끝//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


////studyGroup.js //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//그룹 정보 가져오기
app.post('/getGroupInfo', function (req, res) {
  var functionName = 'getGroupInfo';
  console.log("CALL : " + functionName + " API");

  var data = JSON.parse(req.body.data);


  var query = "SELECT id, studyName, studyGoal, studyIntro, studySt, StudyEd  FROM `Klaytn-DB`.tempGroup WHERE id=?;";
  var params = [data.groupid];

  connection.query(query, params, function (err, rows, fields) {
    if (!err) {
      console.log("COMPLETE : " + functionName + " API\n");
      res.json(JSON.stringify(rows));
    } else
      console.log('\nError while performing Query.', err);
  });
});

//게시글 작성
app.post('/sendNotice', function (req, res) {
  var functionName = 'sendNotice';
  console.log("CALL : " + functionName + " API");

  var data = JSON.parse(req.body.data);


  var query = "INSERT INTO `Klaytn-DB`.`noticeBoard` (`userAddress`, `groupIndex`, `noticeTitle`, `noticeText`) VALUES (?,?,?,?);";
  var params = [data.address, data.groupid, data.title, data.main];

  connection.query(query, params, function (err, rows, fields) {
    if (!err) {
      if (rows.insertId !== 0)
        res.json(JSON.stringify({
          data: true
        }));
      else
        res.json(JSON.stringify({
          data: false
        }));
      console.log("COMPLETE : " + functionName + " API\n");
    } else
      console.log('\nError while performing Query.', err);
  });
});

//그룹 게시글 가져오기
app.post('/getGroupNotice', function (req, res) {
  var functionName = 'getGroupNotice';
  console.log("CALL : " + functionName + " API");

  var data = JSON.parse(req.body.data);

  var query = "SELECT id, noticeTitle FROM `Klaytn-DB`.noticeBoard WHERE groupIndex=?;";
  var params = [data.groupid];

  connection.query(query, params, function (err, rows, fields) {
    if (!err) {
      console.log("COMPLETE : " + functionName + " API\n");
      res.json(JSON.stringify(rows));
    } else
      console.log('\nError while performing Query.', err);
  });
});

//게시글 내용 가져오기
app.post('/getNotice', function (req, res) {
  var functionName = 'getNotice';
  console.log("CALL : " + functionName + " API");

  var data = JSON.parse(req.body.data);

  var query = "SELECT id, noticeTitle, noticeText FROM `Klaytn-DB`.noticeBoard WHERE id=?;";
  var params = [data.id];

  connection.query(query, params, function (err, rows, fields) {
    if (!err) {
      console.log("COMPLETE : " + functionName + " API\n");
      res.json(JSON.stringify(rows));
    } else
      console.log('\nError while performing Query.', err);
  });
});



//게시글 점수 주기
app.post('/sendNoticeLog', function (req, res) {
  var functionName = 'sendNoticeLog';
  console.log("CALL : " + functionName + " API");

  var data = JSON.parse(req.body.data);
  //noticeId, address, score
  var query = "SELECT id FROM `Klaytn-DB`.noticeeLog WHERE userAddress = ? AND noticeBoardid = ?;";
  var params = [data.address, data.noticeId];

  connection.query(query, params, function (err, rows, fields) {
    if (!err) {
      console.log("COMPLETE : " + functionName + " API\n");
      if (rows.length === 0)
      {        
        //인서트
        var query2 = "INSERT INTO `Klaytn-DB`.`noticeeLog` (`userAddress`, `noticeBoardid`, `noticeScore`) VALUES (?,?,?);";
        var params2 = [data.address, data.noticeId, data.score];
        connection.query(query2, params2, function (err, rows, fields) {
          if(!err){
            if (rows.insertId !== 0)
            res.json(JSON.stringify({
              data: true
            }));
          else
            res.json(JSON.stringify({
              data: false
            }));
          }
          else{
            console.log("err")
            res.json(JSON.stringify({
              data: false
            }));
          }
        });
      }
      else
      {
        //업데이트
        var query2 = "UPDATE `Klaytn-DB`.`noticeeLog` SET `noticeScore` = ? WHERE (`id` = ?);";
        var params2 = [data.score, rows[0].id];
        connection.query(query2,params2, function(err, rows, fields) {
          if(!err){
            if (rows.insertId !== 0)
            res.json(JSON.stringify({
              data: true
            }));
          else
            res.json(JSON.stringify({
              data: false
            }));
          }
          else{
            console.log("err")
            res.json(JSON.stringify({
              data: false
            }));
          }
        });
      } 
    } else
      console.log('\nError while performing Query.', err);
  });
});

//컨트랙 id부르기
app.post('/getContractId', function (req, res) {
  var functionName = 'getContractId';
  console.log("CALL : " + functionName + " API");

  var data = JSON.parse(req.body.data);

  var query = "SELECT contractIndex FROM `Klaytn-DB`.tempGroup WHERE id=?;";
  var params = [data.groupid];

  connection.query(query, params, function (err, rows, fields) {
    if (!err) {
      console.log("COMPLETE : " + functionName + " API\n");
      res.json(JSON.stringify(rows));
    } else
      console.log('\nError while performing Query.', err);
  });
});


//컨트랙 id부르기
app.post('/getGroupUserTotalScore', function (req, res) {
  var functionName = 'getGroupUserTotalScore';
  console.log("CALL : " + functionName + " API");

  var data = JSON.parse(req.body.data);

  //groupid, address
  var query = "SELECT SUM(noticeScore) FROM `Klaytn-DB`.noticeeLog WHERE noticeBoardid in (SELECT id FROM `Klaytn-DB`.noticeBoard WHERE groupIndex = ? AND userAddress = ?);";
  var params = [data.groupid, data.address];

  connection.query(query, params, function (err, rows, fields) {
    if (!err) {
      console.log("COMPLETE : " + functionName + " API\n");
      res.json(JSON.stringify(rows));
    } else
      console.log('\nError while performing Query.', err);
  });
});
////studyGroup.js 끝//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




app.post('/joinList', function (req, res) {
  console.log("CALL : " + "joinGroup" + "API");

  var data = JSON.parse(req.body.data);
  var query = "select studyName, id from `Klaytn-DB`.tempGroup where id in (SELECT groupid  FROM `Klaytn-DB`.userGroupList WHERE userAddress='" + data.userAddress + "');"
  connection.query(query, function (err, rows, fields) {
    if (!err) {
      console.log("Add tempGroup Success");
      console.log(rows);
      res.json(JSON.stringify(rows));
      // res.json( { data: "false" } );
    } else
      console.log('Error while performing Query.', err);
  });

});

//그룹 돈 보내기 승인
app.post('/reservationGroup', function (req, res) {
  console.log("CALL : " + "reservationGroup" + "API");

  var data = JSON.parse(req.body.data);
  var query = "SELECT id from `Klaytn-DB`.userGroupList WHERE (`userAddress` = '" + data.userAddress + "' and `groupid` = '" + data.groupIndex + "');"
  connection.query(query, function (err, rows, fields) {
    if (!err) {
      console.log("Add tempGroup Success");
      var query2 = "UPDATE `Klaytn-DB`.`userGroupList` SET `paymentStatus` = '1' WHERE (`id` = '" + rows[0].id + "')";
      connection.query(query2, function (err, rows, fields) {
        if (!err) {
          console.log('end change');
          // console.log(rows);
          res.json({
            data: "true"
          });
        } else {
          console.log("err")
          res.json({
            data: "false"
          });
        }
      });

      // res.json(JSON.stringify(rows));
      // res.json( { data: "false" } );
    } else
      console.log('Error while performing Query.', err);
  });

});

app.post('/userGroupList', function (req, res) {
  console.log("CALL : " + "userGroupList" + "API");

  var data = JSON.parse(req.body.data);
  var groupid = data.groupid;

  var query = "SELECT userAddress FROM `Klaytn-DB`.userGroupList where `groupid`='" + groupid + "' and `paymentStatus` = '1';";
  connection.query(query, function (err, rows, fields) {
    if (!err) {
      console.log("Add tempGroup Success");
      console.log(rows);
      res.json(JSON.stringify(rows));
      // res.json( { data: "false" } );
    } else
      console.log('Error while performing Query.', err);
  });

});

app.post('/ownList', function (req, res) {
  console.log("CALL : " + "ownList" + "API");

  var data = JSON.parse(req.body.data);
  var query = "select studyName, id, studentLimit from `Klaytn-DB`.tempGroup where groupOwner='" + data.userAddress + "';"
  connection.query(query, function (err, rows, fields) {
    if (!err) {
      console.log("ownList Success");
      console.log(rows);
      res.json(JSON.stringify(rows));
      // res.json( { data: "false" } );
    } else
      console.log('Error while performing Query.', err);
  });

});




app.listen(port, function () {
  console.log('\n\nServer Port : ' + port + '\n\n');
});