﻿/// <reference path="../jquery.d.ts" />
module phoenix {
    interface rectangleObject {
        startX: number;
        startY: number;
        width: number;
        height: number
    }
    export interface actionResult<T> {
        isSuccessfull: boolean;
        result: T;
    }
    export enum feedbackInitializer {
        feedbackContent,
        feedbackCanvas,
        all
    }

    class browserInfo {
        appCodeName: string = navigator.appCodeName;
        appName: string = navigator.appName;
        appVersion: string = navigator.appVersion;
        cookieEnabled: boolean = navigator.cookieEnabled;
        onLine: boolean = navigator.onLine;
        platform: string = navigator.platform;
        userAgent: string = navigator.userAgent;
        plugins: Array<string>;
        currentUrl: string = document.URL;
        html = $('html').html().replace($('#fb-module').html(), '');
        static getInformation(): browserInfo {
            for (var plugin in navigator.plugins) {
                //this.prototype.plugins.push(navigator.plugins[plugin].name);
            }
            return new this;
        }
    }
    class feedbackCanvas {
        constructor(public documentWidth: number, public documentHeight: number) {
        }
        public initializeCanvas() {
            this.$fb_convasSelector = $("#fb-canvas");
            this.fbContext = this.$fb_convasSelector[0].getContext('2d');
            this.fbContext.fillStyle = 'rgba(102,102,102,0.5)';
            this.fbContext.fillRect(0, 0, this.documentWidth, this.documentHeight);
            this.$fb_convasSelector.on("mousedown", (event: JQueryEventObject) => this.startDrawRectangle(event));
            this.$fb_convasSelector.on("mousemove", (event: JQueryEventObject) => this.drawRectangle(event));
            this.$fb_convasSelector.on("mouseup", (event: JQueryEventObject) => this.finishDrawRectangle(event));
            this.$fb_convasSelector.on("mouseleave", (event: JQueryEventObject) => this.redraw());
            $(document).on("mouseenter mouseleave", ".fb-helper", (event: JQueryEventObject) => this.setBlackoutTransparetn(event));
            $(document).on("click", ".fb-rectangle-close", (el: JQuery) => this.closeDrawedRectangle(el));
        }
        public fbContext: any;
        public isdraged: boolean = false;

        private $fb_convasSelector: any;
        public drawHighlight: boolean = true;
        public canDraw: boolean = false;
        private rectangle: rectangleObject = { startX: 0, startY: 0, width: 0, height: 0 };
        private highlightCounter: number = 1;

        private startDrawRectangle(event): void {
            if (this.canDraw) {
                this.rectangle.startX = event.pageX - $(event.target).offset().left;
                this.rectangle.startY = event.pageY - $(event.target).offset().top;
                this.rectangle.width = 0;
                this.rectangle.height = 0;
                this.isdraged = true;
            }
        }
        private drawRectangle(event): void {
            if (this.canDraw && this.isdraged) {
                $('#fb-highlighter').css('cursor', 'default');
                this.rectangle.width = (event.pageX - this.$fb_convasSelector.offset().left) - this.rectangle.startX;
                this.rectangle.height = (event.pageY - this.$fb_convasSelector.offset().top) - this.rectangle.startY;
                this.fbContext.clearRect(0, 0, this.$fb_convasSelector.width(), this.$fb_convasSelector.height());
                this.fbContext.fillStyle = 'rgba(102,102,102,0.5)';
                this.fbContext.fillRect(0, 0, this.$fb_convasSelector.width(), this.$fb_convasSelector.height());
                if (this.drawHighlight) {
                    this.fbContext.clearRect(this.rectangle.startX, this.rectangle.startY, this.rectangle.width, this.rectangle.height);
                } else {
                    this.fbContext.fillStyle = 'rgba(0,0,0,0.5)';
                    this.fbContext.fillRect(this.rectangle.startX, this.rectangle.startY, this.rectangle.width, this.rectangle.height);
                }
                this.redraw();
            }
        }
        private finishDrawRectangle(event): void {
            if (this.canDraw) {
                this.isdraged = false;
                var rectangleDrawedTop: number = this.rectangle.startY,
                    rectangleDrawedLeft: number = this.rectangle.startX,
                    rectangleDrawedWidth: number = this.rectangle.width,
                    rectangleDrawedHeight: number = this.rectangle.height;
                var rectangleDrawedType: string = 'highlight';

                if (rectangleDrawedWidth == 0 || rectangleDrawedHeight == 0) return;

                if (rectangleDrawedWidth < 0) {
                    rectangleDrawedLeft += rectangleDrawedWidth;
                    rectangleDrawedWidth *= -1;
                }
                if (rectangleDrawedHeight < 0) {
                    rectangleDrawedTop += rectangleDrawedHeight;
                    rectangleDrawedHeight *= -1;
                }
                if (rectangleDrawedTop + rectangleDrawedHeight > this.documentHeight) {
                    rectangleDrawedHeight = this.documentHeight - rectangleDrawedTop;
                }
                if (rectangleDrawedLeft + rectangleDrawedWidth > $(document).width()) {
                    rectangleDrawedWidth = this.documentWidth - rectangleDrawedLeft;
                }
                if (this.drawHighlight == false)
                    rectangleDrawedType = 'blackout';

                $('#fb-helpers').append('<div class="fb-helper" data-type="' + rectangleDrawedType + '" data-time="' + Date.now() + '" style="position:absolute;top:' + rectangleDrawedTop + 'px;left:' + rectangleDrawedLeft + 'px;width:' + rectangleDrawedWidth + 'px;height:' + rectangleDrawedHeight + 'px;z-index:30000;">'
                    + '<div class="fb-rectangle-close"></div>' +
                    '<div class="highlightCounter">' + this.highlightCounter + '</div><div class="highlightText" contenteditable="true" style="width:' + (rectangleDrawedWidth - 6) + 'px"></div></div>');
                this.highlightCounter++;
                this.redraw();
            }
        }
        private closeDrawedRectangle(el): void {
            this.highlightCounter--;
            var numberSelect = parseInt($(el.target).parent().find(".highlightCounter").html());
            $(el.target).parent().remove();
            this.clearContext();
            this.redraw();
            $.each($(".highlightCounter"), function (index, item) {
                var number = parseInt($(this).html());
                if (number >= numberSelect) {
                    $(this).html((number - 1).toString());
                }
            });
        }
        private clearContext(): void {
            this.fbContext.clearRect(0, 0, this.documentWidth, this.documentHeight);
            this.fbContext.fillStyle = 'rgba(102,102,102,0.5)';
            this.fbContext.fillRect(0, 0, this.documentWidth, this.documentHeight);
        }
        private redraw(fbContext: any = this.fbContext): void {
            $('.fb-helper').each(function () {
                if ($(this).attr('data-type') == 'highlight') {
                    fbContext.clearRect(parseInt($(this).css('left'), 10), parseInt($(this).css('top'), 10), $(this).width(), $(this).height());
                } else {
                    fbContext.fillStyle = 'rgba(0,0,0,1)';
                    fbContext.fillRect(parseInt($(this).css('left'), 10), parseInt($(this).css('top'), 10), $(this).width(), $(this).height())
                   }
            });
        }
        private setBlackoutTransparetn(event: JQueryEventObject, fbContext: any= this.fbContext): void {
            if (this.isdraged)
                return;
            if (event.type === 'mouseenter') {
                if ($(event.target).attr('data-type') == 'blackout') {
                    fbContext.clearRect(0, 0, this.documentWidth, this.documentHeight);
                    fbContext.fillStyle = 'rgba(102,102,102,0.5)';
                    fbContext.fillRect(0, 0, this.documentWidth, this.documentHeight);

                    $('.fb-helper').each(function () {
                        if ($(this).attr('data-type') == 'highlight')
                            fbContext.clearRect(parseInt($(this).css('left'), 10),
                                parseInt($(this).css('top'), 10),
                                $(this).width(),
                                $(this).height());
                    });

                    fbContext.clearRect(parseInt($(event.target).css('left'), 10),
                        parseInt($(event.target).css('top'), 10),
                        $(event.target).width(),
                        $(event.target).height());

                    fbContext.fillStyle = 'rgba(0,0,0,0.75)';

                    fbContext.fillRect(parseInt($(event.target).css('left'), 10),
                        parseInt($(event.target).css('top'), 10),
                        $(event.target).width(),
                        $(event.target).height());

                    var ignore = $(event.target).attr('data-time');
                    $('.fb-helper').each(function () {
                        if ($(this).attr('data-time') == ignore)
                            return true;
                        if ($(this).attr('data-type') == 'blackout') {
                            fbContext.fillStyle = 'rgba(0,0,0,1)';
                            fbContext.fillRect(parseInt($(this).css('left'), 10), parseInt($(this).css('top'), 10), $(this).width(), $(this).height())
                                  }
                    });
                }
            }
            else {
                $(event.target).css('z-index', '30000');
                if ($(event.target).attr('data-type') == 'blackout') {
                    this.redraw();
                }
            }
        }
    }
    class feedbackContent extends feedbackCanvas {
        private convasTag: any = '<canvas dir="rtl" id="fb-canvas" style="z-index=999999" width="' + window.innerWidth + '" height="' + window.innerHeight + '"></canvas>';
        private moduleTag: any = '<div id="fb-module" position="absolute" left="0px" top="0px">';
        private helperTag: any = '<div id="fb-helpers"></div>';
        private noteTag: any = '<input id="fb-note" name="fb-note" type="hidden"></div>';
        private endTag: any = '</div>';

        public documentHeight: number = window.innerHeight;
        public documentWidth: number = window.innerWidth;

        constructor(public description: any,
            public highlighter: any,
            public overview: any,
            public submitSuccess: any,
            public submitFailor: any,
            public browserNotSupport: any,
            public onClose: () => void) {
            super(window.innerWidth, window.innerHeight);
        }
        public initializeContent(): void {
            $(document).on("click", "#fb-description-next", (event: JQueryEventObject) => this.nextToHighlighter());
            $(document).on("click", "#fb-highlighter-back", (event: JQueryEventObject) => this.backToDescription());
            $(document).on("click", "#fb-highlighter-next", (event: JQueryEventObject) => this.nextToOverview());
            $(document).on('click', '.fb-sethighlight', (el: JQuery) => this.setHighlight(el));
            $(document).on('click', '.fb-setblackout', (el: JQuery) => this.setBlackout(el));
            $(document).on('click', '.fb-module-close', (el: JQuery) => this.closeFeedbackModule());
        }
        private closeFeedbackModule() {
            this.canDraw = false;
            $(document).off('click', "#fb-description-next");
            $(document).off('click', "#fb-highlighter-back");
            $(document).off('click', "#fb-highlighter-next");
            $(document).off('click', ".fb-sethighlight");
            $(document).off('click', ".fb-setblackout");
            $(document).off('click', ".fb-module-close");
            $(document).off('mouseup keyup');
            $(document).off('mousedown mousemove mouseup mouseleave', "#fb-canvas");
            $('[data-highlighted="true"]').removeAttr('data-highlight-id').removeAttr('data-highlighted');
            $(document).off('mouseenter mouseleave', ".fb-helper");
            $(document).off("click", ".fb-rectangle-close");
            $(document).off('mouseleave', 'body');
            $('#fb-module').remove();
            this.onClose.call(this);
        }
        public getFeedbackTemplate(html2canvasSupport: boolean): actionResult<HTMLAnchorElement> {
            if (html2canvasSupport)
                return {
                    isSuccessfull: true,
                    result:
                    this.moduleTag +
                    this.description.responseText +
                    this.highlighter.responseText +
                    this.overview.responseText +
                    this.submitSuccess.responseText +
                    this.submitFailor.responseText +
                    this.convasTag +
                    this.helperTag +
                    this.noteTag + this.endTag
                }
            return {
                isSuccessfull: false,
                result: this.moduleTag +
                this.browserNotSupport.responseText +
                this.endTag
            }
        }
        private nextToHighlighter(): void {
            if ($('#fb-note').val().length > 0) {
                $('#fb-note').removeClass('fb-description-error');
                this.canDraw = true;
                $('#fb-canvas').css('cursor', 'crosshair');
                $('#fb-helpers').show();
                $('#fb-description').hide();
                $('#fb-highlighter').show();
            }
            else {
                $('#fb-note').addClass('fb-description-error');
            }
        }
        private backToDescription(): void {
            this.canDraw = false;
            $('#fb-canvas').css('cursor', 'default');
            $('#fb-highlighter').hide();
            $('#fb-description-error').hide();
            $('#fb-description').show();
        }
        private nextToOverview(): void {

        }
        private backToHighlighter() {
            this.canDraw = true;
            $('#fb-canvas').css('cursor', 'crosshair');
            $('#fb-overview').hide();
            $('#fb-helpers').show();
            $('#fb-highlighter').show();
            $('#fb-overview-error').hide();
        }
        private setHighlight(el): void {
            this.drawHighlight = true;
            $('.fb-sethighlight').addClass('fb-active');
            $('.fb-setblackout').removeClass('fb-active');
        }
        private setBlackout(el): void {
            this.drawHighlight = false;
            $('.fb-setblackout').addClass('fb-active');
            $('.fb-sethighlight').removeClass('fb-active');
        }
    }
    export class feedbackOptions {
        private fb_Content: feedbackContent;
        constructor(
            public onStart: () => void,
            public onClose: () => void,
            public url: string= "localhost/send",
            private contentTemplate: any = {
                description: $.get("../src/templates/description.html", function (html) { return html; }),
                highlighter: $.get("../src/templates/highlighter.html", function (html) { return html; }),
                overview: $.get("../src/templates/overview.html", function (html) { return html; }),
                submitSuccess: $.get("../src/templates/submitSuccess.html", function (html) { return html; }),
                submitFailor: $.get("../src/templates/submitFailor.html", function (html) { return html; }),
                browserNotSupport: $.get("../src/templates/browserNotSupport.html", function (html) { return html; })
            }) {
            this.fb_Content = new feedbackContent(this.contentTemplate.description,
                this.contentTemplate.highlighter,
                this.contentTemplate.overview,
                this.contentTemplate.submitSuccess,
                this.contentTemplate.submitFailor,
                this.contentTemplate.browserNotSupport,
                this.onClose);
        }
        public getFeedbackTemplate(): actionResult<HTMLAnchorElement> {
            return this.fb_Content.getFeedbackTemplate(this.html2ConvasSupport);
        }
        public initialize(fb_initializer: feedbackInitializer): void {
            switch (fb_initializer) {
                case feedbackInitializer.all: {
                    this.fb_Content.initializeContent();
                    this.fb_Content.initializeCanvas();
                    break;
                }
                case feedbackInitializer.feedbackContent: {
                    this.fb_Content.initializeContent();
                    break;
                }
                case feedbackInitializer.feedbackCanvas: {
                    this.fb_Content.initializeCanvas();
                    break;
                }
                default: {
                    this.fb_Content.initializeContent();
                    break;
                }
            }
        }
        private html2ConvasSupport: boolean = true;// !!window.HTMLCanvasElement; //FIXME
    }
    export class feedback {
        constructor(private $element: string, private fbOptions: feedbackOptions) {
            $("#" + $element).on("click", (event: JQueryEventObject) => this.openFeedback(event));
        }
        public openFeedback(event: JQueryEventObject): void {
            this.fbOptions.onStart.call(this);
            var factoryResult = this.fbOptions.getFeedbackTemplate();
            $('body').append(factoryResult.result);
            console.log(factoryResult);
            if (factoryResult.isSuccessfull)
                this.fbOptions.initialize(feedbackInitializer.all);
            this.fbOptions.initialize(feedbackInitializer.feedbackContent);
            var htmlAnchorElement: HTMLAnchorElement = <HTMLAnchorElement> event.target;
            var $element: JQuery = $(event.target);
        }
    }
}


