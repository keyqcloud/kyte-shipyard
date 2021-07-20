// accessKey, identifier, account_number
var k = new Kyte('https://us-east-1.kyte.keyq.cloud', '24ede99806a2efe7d66f3c98f6f57bd419b74c59', '60f092ba7631f', '7714a31beab85631de3f');
k.init();
$(document).ready(function () {
    $("#logout").click(function () {
        $('#pageLoaderModal').modal('show');
		k.sessionDestroy(function () {
			location.href = "/";
		});
	});
});