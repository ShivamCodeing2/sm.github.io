
/** ------------------------------------------------------------------------------------------------
 * @brief	DataViewに指定の型で値を格納する。iQ-R流用　type値を仕様に合わせ変更
 * -----------------------------------------------------------------------------------------------*/
function setDataView( value, type, dataView, endian )
{
	switch( type ){
		// ワード符号なし
		case '1':
			dataView.setUint16(0, value, endian);
			break;
		// ダブルワード符号あり
		case '2':
			dataView.setInt32(0, value, endian);
			break;
		// ダブルワード符号なし
		case '3':
			dataView.setUint32(0, value, endian);
			break;
		// 単精度実数
		case '4':
			dataView.setFloat32(0, value, endian);
			break;
		// 倍精度
		case '5':
			dataView.setFloat64(0, value, endian);
			break;
		// ビット
		case '6':
			dataView.setUint8(0, value, endian);
			break;
		// ワード符号あり
		default:
			dataView.setInt16(0, value, endian);
			break;
	}
}

/** ------------------------------------------------------------------------------------------------
 * @brief	X,Yのインデックスを16進数に変換（SystemWeb完全流用）　iQ-F
 * -----------------------------------------------------------------------------------------------*/
function changeDevItem( str )
{
	var devstr = str;
	var xynum;
	var devitem = str;

	if( 0 == devstr.indexOf('X') ){
		xynum = devstr.substr( devstr.indexOf('X')+1, devstr.length );
		devstr = parseInt(xynum,8);
		devitem = 'X' + devstr.toString(16);
	}else if( 0 == devstr.indexOf('Y') ){
		xynum = devstr.substr( devstr.indexOf('Y')+1, devstr.length );
		devstr = parseInt(xynum,8);
		devitem = 'Y' + devstr.toString(16);
	}

	return devitem;
}

/** ------------------------------------------------------------------------------------------------
 * @brief	DataViewの内容を16進数で返却する。iQ-R流用　ローカル変数名、type値を変更
 * -----------------------------------------------------------------------------------------------*/
function getDataView16( type, dataView, endian )
{
	var datval;

	switch( type ){
		// ダブルワード符号あり
		case '2':
		// ダブルワード符号なし
		case '3':
		// 単精度実数
		case '4':
			datval = dataView.getUint32(0, endian).toString(16);
			break;
		// 倍精度実数
		case '5':
			var value1	= ('00000000' + dataView.getUint32(0, endian).toString(16)).slice(-8).toUpperCase();
			var value2	= ('00000000' + dataView.getUint32(4, endian).toString(16)).slice(-8).toUpperCase();
			datval	= value2 + value1;
			break;
		// ワード符号あり、ワード符号無し、2進数
		default:
			datval = dataView.getUint16(0, endian).toString(16);
			break;
	}
	return datval;
}


function WriteDevice(num) {
	var xhr;
	var param = 'NUM=1&';
	var aryBuff = new ArrayBuffer(16);
	var dataView = new DataView(aryBuff);
	var devitem = document.getElementById('DWDEV'+num);
	var typitem = document.getElementById('DWTYP'+num);
	var dataitem = document.getElementById('DWDAT'+num);
	var fmtitem =  document.getElementById('DWFMT'+num);
	var langitem =  document.getElementById('DWLANG'+num);
	var dspitem =  document.getElementById('DWDSP'+num);
	var datval;
	
	if( '1' == dspitem.value ){
		if(!confirm(formatter(getMsgStr('MSG_WTR_BTN_0002', parseInt(langitem.value)), devitem.value, dataitem.value))){
			return;
		}
	}
	
	// デバイス設定
	var dev = changeDevItem( devitem.value );	// X、Yのインデックス右派16進数に変換する
	param += 'DEV1=' + dev + '&';

	// データ型に応じたTYPEを設定する。
	if( '6' == typitem.value ) {
	   param += 'TYP1=' + 'B';
	}
	else if( ('0' == typitem.value) || ('1' == typitem.value) ) {
	   param += 'TYP1=' + 'W';
	}
	else if( ('2' == typitem.value) || ('3' == typitem.value) || ('4' == typitem.value) ) {
	   param += 'TYP1=' + 'D';
	}
	else{
	   param += 'TYP1=' + 'Q';
	}
	param += '&';
	
	
	// 値設定
	// 16進数設定時はそのまま反映
	if( 'H' == fmtitem.value ){
		datval = dataitem.value;
	// 10進数、2進数の場合は、データ型に応じて16進数変換を行う。
	}else{
		// 値設定
		setDataView( dataitem.value, typitem.value, dataView, true );
		datval = getDataView16( typitem.value, dataView, true );
	}
	
	// 値部パラメータ設定
	param += 'DATA1=' + datval;
	
	// パラメータをポスト送信
	xhr = new XMLHttpRequest();
	xhr.open('POST', '/cgi/WrDev.cgi', true);
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	var FUNC = function() { WriteDevice_Response(xhr, typitem, dataitem); };
	xhr.onreadystatechange = FUNC;
	xhr.send(param);
}

function WriteDevice_Response(xhr, typitem, dataitem) {
	// XMLHttpRequestクライアント状態のチェック
	// 0:UNSENT 1:OPENED 2:HEADERS_RECEIVED 3:LOADING 4:DONE
	if( 4 != xhr.readyState ) {
		// ステータス4 のDONE(操作完了)以外の場合は，処理を終了する。
		return;
	}
	// HTTPレスポンスコードのチェック
	if ( 200 != xhr.status ) {
		// 「200 OK」以外の場合は，エラーのダイアログ表示をする。
		alert('HTTP STATUS ERROR=' + xhr.status );
		return;
	}
	var value;
	var res = JSON.parse( xhr.response ); // JSON 文字列の解析処理

	// 権限無し以外のエラー
	if( '0000' != res.RET ) {
		// 異常の場合エラーのダイアログを表示する。
		alert('ERROR=' + res.RET);
	}
	else {
		// 正常の場合は，書込み結果値の値を反映する。
		//dataitem.value = parseInt(res.DATA[0],16);
		//alert("書込完了");
	}
}

