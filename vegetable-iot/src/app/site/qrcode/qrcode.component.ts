import { Component, OnInit, ElementRef } from '@angular/core';


declare var jQuery: any;
declare var $ : any;
declare var Utf8 : any;
@Component({
    templateUrl: 'qrcode.component.html',
    styleUrls: ['./qrcode.component.css'] 
    
})

export class QRCodeComponent implements OnInit {
    public model: any = {};
    public myFile:  any;
    constructor(public elementRef:ElementRef){}

    ngOnInit() {
    }

    ngAfterViewInit(){
        var s = document.createElement("script");
        s.type = "text/javascript";
        s.src = "assets/js/jquery.qrcode.min.js";
        this.elementRef.nativeElement.appendChild(s);
        var s1 = document.createElement("script");
        s1.type = "text/javascript";
        s1.src = "assets/js/utf-8.js";
        this.elementRef.nativeElement.appendChild(s1);
    }

    createQRCode(){
        $("#qrcode").empty();
        if (typeof this.model.qrcode_text === "undefined" || this.model.qrcode_text == 0)
            alert("QRCode text is required");
        else{
            var text = this.model.qrcode_text;
            var myFile = this.myFile;
            var width = $(document).width();
            var ws = width > 1126? 2:1.5;
            jQuery(function(){
                jQuery('#qrcode').qrcode({id: "canvas", width: 200*ws,height: 200*ws,text: Utf8.encode(text)});
                $("canvas").attr('id', 'canvas');
                let canvas = document.getElementById("canvas") as HTMLCanvasElement;
                var context = canvas.getContext('2d');
                var imageObj = new Image();

                imageObj.onload = function() {
                    context.drawImage(imageObj, 75*ws, 75*ws, 60*ws, 60*ws);
                };

                if ( typeof myFile === 'undefined' || !myFile)
                    imageObj.src = 'assets/img/logo.png';
                else{
                    imageObj.src = $("#new_logo").attr("src");
                }
            })
        }
    }

    downloadQRCode(downloadLink){
        if (typeof this.model.qrcode_text === "undefined" || this.model.qrcode_text == 0){
            alert("QRCode is empty");
            return false;
        }
        else {
            var filename = prompt("Please enter filename ", "");
            if (filename == null || filename == "") {
                return false;
            } else {
                let canvas = document.getElementById("canvas") as HTMLCanvasElement;
                downloadLink.href = canvas.toDataURL();
                downloadLink.download = filename + ".png";
                this.model.qrcode_text = "";
            }
            
        }
    }

    uploadLogo(){
        $('#new_logo').hide();
        this.myFile = document.getElementById("myFile") as HTMLInputElement;
        if (this.myFile.files && this.myFile.files[0] && this.myFile.files.length){
            if(!/(\.png|\.jpg|\.jpeg)$/i.test(this.myFile.value)){
                alert("Invalid image file type.");
                this.myFile = null;
                return false;
            }
            var reader = new FileReader();
            reader.onload = (e:any) => {
                $('#new_logo')
                        .attr('src', e.target.result)
                        .width(100)
                        .height(150).show();
            }
            reader.readAsDataURL(this.myFile.files[0]);
        }
    }
}