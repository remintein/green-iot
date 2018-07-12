var userService = require('./user.service');
var Q = require('q');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // secure:true for port 465, secure:false for port 587
    auth: {
    	type: 'OAuth2',
        user: 'iot.vtgcorp@gmail.com',
        clientId:'470688723693-cqn1cdjk7d1jcp3fe5a1ijifc0o7idmf.apps.googleusercontent.com',
        clientSecret:'pLsWHD0rCOqhV43dl7ywK3Tr',
        refreshToken: '1/Na1YsWGDDBWILiR5yDtvtQgO1BZXUSnpVTho_fFuht0',
        accessToken: 'ya29.GluZBDYPkfhghSd0dd7ZLGoq46wI345FZV1dwedXHNo6zbvMGeskegd-qSQX_SriiyL9pmw0maN5klMM8DRAM08XUcjVopr0fFHVfovwOvsoQ-waVSPILBX_Mepy',
        expires: 3600
    }
});
var service ={};
	service.send = send;
	module.exports = service;
// send mail with defined trans  port object
 function send(maildata){
 	var deferred = Q.defer();
 	var userReceive = userService.getUsersMail()
 		.then(function(str_user){
 			var mailOptions = {
			    from: maildata.from +' <iot.vtgcorp@gmail.com>', // sender address
		        to: str_user, // list of receivers
			    subject: maildata.subject, // Subject line
			    text: maildata.text, // plain text body
			    html: maildata.html, // html body
			    attachments: maildata.attachments
			};
		 	transporter.sendMail(mailOptions, (error, info) => {
			    if (error) deferred.reject(err);
			    deferred.resolve(maildata.server);
			});
 		})
 		.catch(function (err) {
            deferred.reject(err);
        });
    return deferred.promise;
}