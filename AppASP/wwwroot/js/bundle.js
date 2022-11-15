$(document).ready(
    function () {

        //Класс определяющий состояние прибора
        class DeviceClass {
            ID = 0;
    
            DeviceEF = null;

            DestroyModalForm() {
                if (this.DeviceEF == null)
                    return;
                this.DeviceEF.dispose();
                this.DeviceEF = null;
            }

            InitDeviceEF() {
                if (this.DeviceEF == null) {
                    this.DeviceEF = new bootstrap.Modal('#DeviceModal', {
                        keyboard: true
                    })
                }
                this.DeviceEF.show();
            }

            HideModalForm() {
                if (this.DeviceEF !== null) {
                    this.DeviceEF.hide();
                }
            }

            //Получение выделенной строки
            InitDevice_ID() {
                this.ID = 0;
                let item = $('#device_body tr.selectlines:first');

                if (item)
                    this.ID = item.attr('data-id');
            }
        }

        //Класс для окна ожидания
        class WaitingClass {
            WaitingForm = null;

            DestroyWaitingForm() {
                if (this.WaitingForm == null)
                    return;
                this.WaitingForm.dispose();
                this.WaitingForm = null;
            }

            HideWaitingForm() {
                if (this.WaitingForm !== null)
                    this.WaitingForm.hide();
            }

            InitWaitingForm() {
                if (this.WaitingForm == null) {
                    this.WaitingForm = new bootstrap.Modal('#WaitingForm', {
                        keyboard: true
                    })
                }
                this.WaitingForm.show();
            }
        }

        //Через этот объект, а не через всякие теги будем пытаться работать
        let vDevice = new DeviceClass();
        let vWaitingForm = new WaitingClass();

        function GetPath() {
            var vPath = $('#MyUrl').val();
            return vPath;
        }

        $('#DeviceModal').on('shown.bs.modal', function (event) {
            $('#edSerialNumber').focus();
        });

        $('#DeviceModal').on('hidden.bs.modal', function (event) {
            vDevice.DestroyModalForm();
        });

        $('#DeviceModal').on('show.bs.modal', function (event) {
            //Прячем сообщение об ошибках
            var ErrorSpan = document.getElementById("SaveErrorDevice");
            if (ErrorSpan != null)
                ErrorSpan.style.display = "none";

            //Проверяем что щас делаем
            if (vDevice.ID == 0) {
                $(this).find('#DeviceModalLabel').text("Добавить прибор");
                $(this).find('#edSerialNumber').val("");
                $(this).find('#cbRevisions').val(0);
            }
            else {
                $(this).find('#DeviceModalLabel').text("Изменить прибор");
                $(this).find('#edSerialNumber').val($('#device_body tr[data-id="' + vDevice.ID + '"]>td:eq(0)>p').text().trim());
                $(this).find('#cbRevisions').val($('#device_body tr[data-id="' + vDevice.ID + '"]').attr('data-revid'));
            }
        });

        function LocateDevice(pID) {
            $('#device_body tr').removeClass('selectlines');
            $('#device_body tr[data-id="' + pID + '"]').toggleClass('selectlines');
        }

        $('#btnDeviceSave').click(function () {

            var vName = $("#edSerialNumber").val().trim();

            if (vName == "") {
                alert('Серийный номер должен быть задан');
                return;
            }
            var vRevision_ID = $('#cbRevisions').val();
            if (vRevision_ID == "" || vRevision_ID == null) {
               alert('Ревизия должна быть задана');
               return;
           }

           var vModel_ID = GetDeviceModel_ID().trim();

           $.ajax({
               type: 'POST',
               url: GetPath() + '/SaveDevice',
               data: { 'sn': encodeURIComponent(vName), 'current_ID': vDevice.ID, 'model_ID': vModel_ID, 'revision_ID': vRevision_ID },
               success: function (data) {
                   //Текущее представление надо перестроить
                   $('#divSaveDeviceMessage').replaceWith(data);
                   //Если ошибок не существует, то закрываем форму. Здесь 0 - признак ошибки
                   vID = $("#LocateDevice_ID").val().trim();
                   if (vID != '0') {
                       vDevice.HideModalForm();

                       //Необходимо понять на какой странице находится запись и переоткрыть данную страницу + перестроить пагинацию
                       $.ajax({
                           type: 'POST',
                           url: GetPath() + '/GetDevicePageNumber',
                           data: { 'pModel_ID': vModel_ID, 'pDevice_ID': vID},
                           success: function (data) {
                               let pagenumber = data;
                               //Необходимо переоткрыть страницу и спозиционироваться
                               RefreshPagination(pagenumber, vID);
                           },
                           error: function (jqxhr, status, errorMsg) {
                               alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                           }
                       });
                   }
               },
               error: function (jqxhr, status, errorMsg) {
                   $('#divSaveDeviceMessage').html('<b>Произошла ошибка в процесе выполнения!</b>');
                   alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
               }
           });
        });

        //Удаление прибора
        $('#btnDeviceDelete').click(function () {
            DeleteDevice();
        });

        function DeleteDevice() {
            vDevice.InitDevice_ID();

            //Если нет текущего, то посылаем
            var vId = vDevice.ID;

            if (vId == "0" || vId === undefined) {
                alert("Не выбран прибор для удаления");
                return;
            }
            let vSN = $('#device_body tr[data-id="' + vDevice.ID + '"]>td:eq(0)>p').text().trim();

            var resultActionUser = confirm(`Удалить прибор <${vSN}>?`);
            if (!resultActionUser)
                return;

            var vModel_ID = GetDeviceModel_ID();

            //Удаление
            $.ajax({
                type: 'POST',
                url: GetPath() + '/DeleteDevice',
                data: { 'pDevice_ID': vId, 'pModel_ID': vModel_ID },
                success: function (data) {
                    var vpagenumber = data;
                    RefreshPagination(vpagenumber);
                },
                error: function (jqxhr, status, errorMsg) {
                    alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                }
            });
        }

        function GetDeviceModel_ID() {
            return $("#cbModels").val();
        }

        $('#btnDeviceAdd').click(function () {
            var vId = GetDeviceModel_ID();
            if (vId == "0" || vId === undefined) {
                alert("Не выбрана текущая модель");
                return;
            }
            vDevice.ID = 0;
            vDevice.InitDeviceEF();
        });

        $('#btnDeviceUpdate').click(function () {

            vDevice.InitDevice_ID();

            //Если нет текущего, то посылаем
            var vId = vDevice.ID;

            if (vId == "0" || vId === undefined) {
                alert("Не выбран прибор для редактирования");
                return;
            }
            vDevice.InitDeviceEF();
        });

        $('#cbModels').change(
            function () {
                RefreshPagination();

                Model_ID = $(this).val();
                //Загрузка ревизий модели параллельным потоком
                $.ajax({
                    type: 'POST',
                    url: GetPath() + '/GetRevisionsByModel',
                    data: { 'pModel_ID': Model_ID },
                    success: function (data) {
                        $('#cbRevisions').replaceWith(data);
                    },
                    error: function (jqxhr, status, errorMsg) {
                        alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                    }
                });
            }
        );

        function ClearDevices() {
            document.getElementById('dvDevices').innerHTML = "";
            document.getElementById('divPaginationDevices').innerHTML = "";
        }

        function PrepareDeviceGrid() {
            $('#device_body tr').click(function () {
                $('#device_body tr').removeClass('selectlines');
                $(this).toggleClass('selectlines');
            });
        }
       
        //Перестройка пагинации и конкретной страницы данных. Если задана record_id, то позиционирование на неё
        //Если задана record_id, то считаем что она соответствует page
        function RefreshPagination(page = 1, record_id = 0) {
            //Чистим пагинацию и набор приборов
            ClearDevices();

            Model_ID = GetDeviceModel_ID();

           //**********************перестроение пагинации************************
           $.ajax({
                type: 'POST',
                url: GetPath() + '/DevicesPagination',
                data: { 'pModel_ID': Model_ID, 'page': page },
               success: function (data) {
                   $('#divPaginationDevices').html(data);
                    //На все кнопки надо повесить обработчик
                    $('.device-page').click(function (e) {
                        let page = e.target.innerHTML;
                        RefreshPagination(page);
                        return false;
                    });
                },
                error: function (jqxhr, status, errorMsg) {
                    alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                }
            });
            //********************************************************************* 
            
            //Вывод набора приборов на страницу
            $.ajax({
                type: 'POST',
                url: GetPath() + '/RefreshDevices',
                data: { 'pModel_ID': Model_ID,'page': page },
                success: function (data) {
                    $('#dvDevices').replaceWith(data);
                    PrepareDeviceGrid();
                    if (record_id !== 0)
                        LocateDevice(record_id);
                },
                error: function (jqxhr, status, errorMsg) {
                    alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                }
            });
        }

        $('#WaitingForm').on('hidden.bs.modal', function (event) {
            vWaitingForm.DestroyWaitingForm();
        });

        //Пуск длительной операции с ожиданием
        $('#btnRun').click(function () {
            vWaitingForm.InitWaitingForm();
            $.ajax({
                type: 'POST',
                url: GetPath() + '/RunMethod',
                data: { },
                success: function (data) {
                    vWaitingForm.HideWaitingForm();
                },
                error: function (jqxhr, status, errorMsg) {
                    alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                }
            });
        });
 });
/*const exampleModal = document.getElementById('exampleModal')
exampleModal.addEventListener('show.bs.modal', event => {
    // Кнопка, которая активировала модальное окно
    const button = event.relatedTarget
    // Извлекает информацию из атрибутов data-bs-*
    const recipient = button.getAttribute('data-bs-whatever')

    const modalTitle = exampleModal.querySelector('.modal-title')
    //const modalBodyInput = exampleModal.querySelector('.modal-body input')
    //Заголовок окна
    modalTitle.textContent = `${recipient}`
    //modalBodyInput.value = recipient
    const modalname = exampleModal.querySelector('#edModelName')
    const modaldescription = exampleModal.querySelector('#edModelDescription')
    let vID = document.getElementById('Current_Model_ID').value;

    //Определяем что происходит - удаление или редактирование
    if (button.id == "btnModelAdd") {
        modalname.value = "";
        modaldescription = "";
    }
    else {

        if (vID == "0" || vID === undefined) {
            alert("Не выбрана модель для редактирования");
            return;
        }

                
       //$(this).find('#edDeviceTypeName').val($();
       // $(this).find('#edDeviceTypeCode').val($('#model_body tr[data-id="' + vID + '"]>td:eq(1)').text().trim());
    }
});*/

pgrid_function = null;
locate_model = null;
detail_function = null;

$(document).ready(
    function () {

        function GetPath() {
            var vPath = $('#MyUrl').val();
            return vPath;
        }

        $('#exampleModal').on('shown.bs.modal', function (event) {
            $('#edModelName').focus();
        });

        $('#exampleModal').on('hidden.bs.modal', function (event) {
            if (ModelEF == null)
                return;
            ModelEF.dispose();
            ModelEF = null;
        });


        $('#RevisionModal').on('shown.bs.modal', function (event) {
            $('#edRevisionName').focus();
        });

        $('#RevisionModal').on('hidden.bs.modal', function (event) {
            if (RevisionEF == null)
                return;
            RevisionEF.dispose();
            RevisionEF = null;
        });

        $('#exampleModal').on('show.bs.modal', function (event) {
            //Прячем сообщение об ошибках
            var ErrorSpan = document.getElementById("SaveErrorModel");
            if (ErrorSpan != null)
                ErrorSpan.style.display = "none";
            $("#imgModelPhoto").attr('src', '');
            $('#edModelPhoto').val("");
            $('#divImageResult').hide();

            //Проверяем что щас делаем
            var vID = $("#Model_ID").val().trim(); 
            if (vID == 0) {
                $(this).find('#exampleModalLabel').text("Добавить модель");
                $(this).find('#edModelName').val("");
                $(this).find('#edModelDescription').val("");
            }
            else {
                $(this).find('#exampleModalLabel').text("Изменить модель");
                $(this).find('#edModelName').val($('#model_body tr[data-id="' + vID + '"]>td:eq(0)>p').text().trim());
                $(this).find('#edModelDescription').val($('#model_body tr[data-id="' + vID + '"]>td:eq(1)>p').text().trim());
                //Пытаемся подтянуть изображение
                $.ajax({
                    type: 'POST',
                    url: GetPath() + '/GetModelImage',
                    data: {
                        'pModel_ID': vID
                    },
                    success: function (data) {
                        //Перестройка ключа результирующего
                        $("#imgModelPhoto").attr('src', data);
                        if (data != '') {
                            $('#divImageResult').show();
                            //$('#edModelPhoto').text("Файл выбран");
                        }
                    },
                    error: function (jqxhr, status, errorMsg) {
                        $('#divImageResult').html('<b>Произошла ошибка в процесе получения изображения!</b>');
                        alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                    }
                });
            }
        });

        $('#RevisionModal').on('show.bs.modal', function (event) {
            //Прячем сообщение об ошибках
            var ErrorSpan = document.getElementById("SaveErrorRevision");
            if (ErrorSpan != null)
                ErrorSpan.style.display = "none";
            //Проверяем что щас делаем
            var vID = $("#Revision_ID").val().trim();
            if (vID == 0) {
                $(this).find('#RevisionModalLabel').text("Добавить ревизию");
                $(this).find('#edRevisionName').val("");
            }
            else {
                $(this).find('#RevisionModalLabel').text("Изменить ревизию");
                $(this).find('#edRevisionName').val($('#revision_body tr[data-id="' + vID + '"]>td:eq(0)>p').text().trim());
            }
        });

        var ModelEF = null;
        var RevisionEF = null;
   
        function InitModelEF() {
            if (ModelEF == null) {
                ModelEF = new bootstrap.Modal('#exampleModal', {
                    keyboard: true
                })
            }
            ModelEF.show();
        }

        function InitRevisionEF() {
            if (RevisionEF == null) {
                RevisionEF = new bootstrap.Modal('#RevisionModal', {
                    keyboard: true
                })
            }
            RevisionEF.show();
        }

       
        function DeleteModel(pIsConfirmation) {
            //Если нет текущего, то посылаем
            var vId = GetCurrentModel_ID();
            if (vId == "0" || vId === undefined) {
                alert("Не выбрана модель для удаления");
                return;
            }

            $.ajax({
                type: 'POST',
                url: GetPath() + '/CheckDeleteModel',
                data: { 'pModel_ID': vId },
                success: function (data) {
                    $('#ModelError').replaceWith(data);
                    //Проверка флага на возможность удаления
                    var vIsError = $("#IsModelError").val().trim();
                    if (vIsError == '1') {
                        alert('Модель используется. Удаление запрещено.');
                        return;
                    }

                    if (pIsConfirmation) {
                        var resultActionUser = confirm("Удалить модель?");
                        if (!resultActionUser)
                            return;
                        DeleteModel(false);
                    }
                    else {
                        //Удаление
                        $.ajax({
                            type: 'POST',
                            url: GetPath() + '/DeleteModel',
                            data: { 'pModel_ID': vId },
                            success: function (data) {
                                //Переоткрываем грид на этой странице
                                var vpagenumber = data;
                                SetPagination(vpagenumber, 'Models')
                                //$('#dvModels').replaceWith(data);
                                //PrepareModelGrid();
                            },
                            error: function (jqxhr, status, errorMsg) {
                                alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                            }
                        });
                    }
                },
                error: function (jqxhr, status, errorMsg) {
                    $('#ModelError').html('<b>Произошла ошибка в процесе проверки возможности удаления !</b>');
                    alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                    return;
                }
            });
        }

        function DeleteRevision(pIsConfirmation) {
            //Если нет текущего, то посылаем
            var vId = GetCurrentRevision_ID();
            if (vId == "0" || vId === undefined) {
                alert("Не выбрана ревизия для удаления");
                return;
            }
            var vModel_ID = GetCurrentModel_ID();
            $.ajax({
                type: 'POST',
                url: GetPath() + '/CheckDeleteRevision',
                data: { 'pRevision_ID': vId },
                success: function (data) {
                    $('#RevisionError').replaceWith(data);
                    //Проверка флага на возможность удаления
                    var vIsError = $("#IsRevisionError").val().trim();
                    if (vIsError == '1') {
                        alert('Ревизия используется. Удаление запрещено.');
                        return;
                    }

                    if (pIsConfirmation) {
                        var resultActionUser = confirm("Удалить ревизию?");
                        if (!resultActionUser)
                            return;
                        DeleteRevision(false);
                    }
                    else {
                        //Удаление
                        $.ajax({
                            type: 'POST',
                            url: GetPath() + '/DeleteRevision',
                            data: { 'pRevision_ID': vId, 'pModel_ID': vModel_ID },
                            success: function (data) {
                                var vpagenumber = data;
                                RefreshRevisionPagination(vpagenumber);
                            },
                            error: function (jqxhr, status, errorMsg) {
                                alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                            }
                        });
                    }
                },
                error: function (jqxhr, status, errorMsg) {
                    $('#RevisionError').html('<b>Произошла ошибка в процесе проверки возможности удаления !</b>');
                    alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                    return;
                }
            });
        }

        //Удаление модели
        $('#btnModelDelete').click(function () {
            DeleteModel(true);
        });

        //Удаление ревизии
        $('#btnRevisionDelete').click(function () {
            DeleteRevision(true);
        });

        $("#edModelPhoto").change(function () {
            var length = this.files.length;
            if (!length) {
                $("#imgModelPhoto").attr('src', '');
                $('#divImageResult').hide();
                return false;
            }
            if (this.files[0].size > 3000000) {
                alert('Максимальный размер файла должен быть 3 мегабайта!');
                $("#imgModelPhoto").attr('src', '');
                $("#edModelPhoto").val("");
                $('#divImageResult').hide();
                return false;
            }
            useImage(this);
        });

        function useImage(img) {
            var file = img.files[0];
            var imagefile = file.type;
            var match = ["image/jpeg", "image/png", "image/jpg"];
            if (!((imagefile == match[0]) || (imagefile == match[1]) || (imagefile == match[2]))) {
                alert("Invalid File Extension");
            } else {
                var reader = new FileReader();
                reader.onload = imageIsLoaded;
                reader.readAsDataURL(img.files[0]);
            }

            function imageIsLoaded(e) {
                $("#imgModelPhoto").attr('src', e.target.result);
                $('#divImageResult').show();
            }
        }

        function ClearRevisions() {
            document.getElementById('dvRevisions').innerHTML = "";
            document.getElementById('divPaginationRevisions').innerHTML = "";
        }

        function PrepareRevisionGrid() {
            $('#revision_body tr').click(function () {
                $('#revision_body tr').removeClass('selectlines');
                $(this).toggleClass('selectlines');
                //Идентификатор вида продукции
                var vRevision_ID = $(this).data("id");
                $("#Current_Revision_ID").val(vRevision_ID);
            });
        }

        $('#btnModelSave').click(function () {

            var vName = $("#edModelName").val().trim();
            if (vName == "") {
                alert('Название должно быть задано');
                return;
            }

            var vID = $("#Model_ID").val().trim();
            var vDescription = $("#edModelDescription").val().trim();
            var img = $("#imgModelPhoto").attr('src');

            $.ajax({
                type: 'POST',
                url: GetPath() + '/SaveModel',
                data: { 'name': encodeURIComponent(vName), 'current_ID': vID, 'description': vDescription, 'image': img },
                success: function (data) {
                    //Текущее представление надо перестроить
                    $('#divSaveModelMessage').replaceWith(data);
                    //Если ошибок не существует, то закрываем форму. Здесь 0 - признак ошибки
                    vID = $("#LocateModel_ID").val().trim();
                    if (vID != '0') {
                        ModelEF.hide();
                        /*--------------Определение страницы-----------------*/
                        $.ajax({
                            type: 'POST',
                            url: GetPath() + '/GetModelsPageNumber',
                            data: { 'id': vID},
                            success: function (data) {
                                let vpagenumber = data;
                                console.log('SetPagination');
                                SetPagination(vpagenumber, 'Models', vID)
                            },
                            error: function (jqxhr, status, errorMsg) {
                                alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                            }
                        });
                        /*****************************************************/

                        //Необходимо переоткрыть грид и спозиционироваться
                        /*$.ajax({
                            type: 'POST',
                            url: GetPath() + '/GetViewModels',
                            data: {},
                            success: function (data) {
                                $('#dvModels').replaceWith(data);
                                PrepareModelGrid();
                                Locate(vID);
                            },
                            error: function (jqxhr, status, errorMsg) {
                                alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                            }
                        });*/
                        //----------------------------------------------------
                    }
                },
                error: function (jqxhr, status, errorMsg) {
                    $('#divSaveModelMessage').html('<b>Произошла ошибка в процесе выполнения!</b>');
                    alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                }
            });
        });


        $('#btnRevisionSave').click(function () {

            var vName = $("#edRevisionName").val().trim();
            if (vName == "") {
                alert('Название должно быть задано');
                return;
            }

            var vID = $("#Revision_ID").val().trim();
            var vModel_ID = GetCurrentModel_ID().trim();

            $.ajax({
                type: 'POST',
                url: GetPath() + '/SaveRevision',
                data: { 'name': encodeURIComponent(vName), 'current_ID': vID, 'model_ID': vModel_ID },
                success: function (data) {
                    //Текущее представление надо перестроить
                    $('#divSaveRevisionMessage').replaceWith(data);
                    //Если ошибок не существует, то закрываем форму. Здесь 0 - признак ошибки
                    vID = $("#LocateRevision_ID").val().trim();
                    if (vID != '0') {
                        RevisionEF.hide();

                        $.ajax({
                            type: 'POST',
                            url: GetPath() + '/GetRevisionPageNumber',
                            data: { 'pModel_ID': vModel_ID, 'pRevision_ID': vID },
                            success: function (data) {
                                let pagenumber = data;
                                //Необходимо переоткрыть страницу и спозиционироваться
                                RefreshRevisionPagination(pagenumber, vID);
                            },
                            error: function (jqxhr, status, errorMsg) {
                                alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                            }
                        });
                        //Необходимо переоткрыть грид и спозиционироваться
                        /*$.ajax({
                            type: 'POST',
                            url: GetPath() + '/GetViewRevisions',
                            data: { 'pModel_ID': vModel_ID },
                            success: function (data) {
                                $('#dvRevisions').replaceWith(data);
                                PrepareRevisionGrid();
                                LocateRevision(vID);
                            },
                            error: function (jqxhr, status, errorMsg) {
                                alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                            }
                        });*/
                        
                    }
                },
                error: function (jqxhr, status, errorMsg) {
                    $('#divSaveRevisionMessage').html('<b>Произошла ошибка в процесе выполнения!</b>');
                    alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                }
            });
        });

        load();

        function load() {
            PrepareModelGrid();
            RefreshRevisionPagination();
        }

        function Locate(pID) {
            $('#model_body tr').removeClass('selectlines');
            $('#model_body tr[data-id="' + pID + '"]').toggleClass('selectlines');
            //Идентификатор вида продукции
            $("#Current_Model_ID").val(pID);
            
            RefreshRevisionPagination();
        }

        function PrepareModelGrid() {
            //Предварительно подчищаем детальные данные
            // ClearDataDetail();
            $('#model_body tr').click(function () {
                $('#model_body tr').removeClass('selectlines');
                $(this).toggleClass('selectlines');
                //Идентификатор вида продукции
                var vModel_ID = $(this).data("id");
                $("#Current_Model_ID").val(vModel_ID);
                RefreshRevisionPagination();
            });
        }

        function LocateRevision(pID) {
            $('#revision_body tr').removeClass('selectlines');
            $('#revision_body tr[data-id="' + pID + '"]').toggleClass('selectlines');
            $("#Current_Revision_ID").val(pID);
        }

       $('#btnModelAdd').click(function () {
            $("#Model_ID").val(0);
            InitModelEF();
        });

        $('#btnRevisionAdd').click(function () {
            var vId = GetCurrentModel_ID();
            if (vId == "0" || vId === undefined) {
                alert("Не выбрана текущая модель");
                return;
            }
            $("#Revision_ID").val(0);
            InitRevisionEF();
        });

        $('#btnModelUpdate').click(function () {
            //Если нет текущего, то посылаем
            var vId = GetCurrentModel_ID();

            if (vId == "0" || vId === undefined) {
                alert("Не выбрана модель для редактирования");
                return;
            }
            $("#Model_ID").val(vId);
            InitModelEF();
        });

        $('#btnRevisionUpdate').click(function () {
            //Если нет текущего, то посылаем
            var vId = GetCurrentRevision_ID();

            if (vId == "0" || vId === undefined) {
                alert("Не выбрана ревизия для редактирования");
                return;
            }
            
            $("#Revision_ID").val(vId);
            InitRevisionEF();
        });

        //Для пагинации ревизий
        function RefreshRevisionPagination(page = 1, record_id = 0) {
            //Чистим пагинацию и набор приборов
            ClearRevisions();

            Model_ID = GetCurrentModel_ID();
            if (Model_ID == "0" || Model_ID === undefined) {
                Model_ID = 0;
            }

            //**********************перестроение пагинации************************
            $.ajax({
                type: 'POST',
                url: GetPath() + '/RevisionPagination',
                data: { 'pModel_ID': Model_ID, 'page': page },
                success: function (data) {
                    $('#divPaginationRevisions').html(data);
                    //На все кнопки надо повесить обработчик
                    $('.device-page').click(function (e) {
                        let page = e.target.innerHTML;
                        RefreshRevisionPagination(page);
                        return false;
                    });
                },
                error: function (jqxhr, status, errorMsg) {
                    alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                }
            });
            //********************************************************************* 

            //Вывод набора ревизий на страницу
            $.ajax({
                type: 'POST',
                url: GetPath() + '/RefreshRevisions',
                data: { 'pModel_ID': Model_ID, 'page': page },
                success: function (data) {
                    $('#dvRevisions').replaceWith(data);
                    PrepareRevisionGrid();
                    if (record_id !== 0)
                        LocateRevision(record_id);
                },
                error: function (jqxhr, status, errorMsg) {
                    alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                }
            });
        }


        function GetCurrentModel_ID() {
            return $("#Current_Model_ID").val();
        }

        function GetCurrentRevision_ID() {
            return $("#Current_Revision_ID").val();
        }
        pgrid_function = PrepareModelGrid;
        locate_model = Locate;
        detail_function = RefreshRevisionPagination;

    });

function SetPagination(i, controllername, record_id = 0) {

    //fetch
    fetch('/Home/Refresh' + controllername, {
        method: "POST",
        headers: { "Content-type": "application/x-www-form-urlencoded" },
        body: 'page=' + i
    }).
        then(function (response) {
            if (response.status !== 200) {
                console.log('Looks like there was a problem. Status Code: ' + response.status);
                return;
            }
            return response.text();
        }).
        then(
            function (html) {
                document.getElementById('dv' + controllername).outerHTML = html;
            }).
        then(
            //Перестройка пагинации
            function () {
                fetch('/Home/' + controllername + 'Pagination', {
                    method: "POST",
                    headers: { "Content-type": "application/x-www-form-urlencoded" },
                    body: 'page=' + i
                }).
                    then(
                        function (response) {
                            if (response.status !== 200) {
                                console.log('Looks like there was a problem. Status Code: ' + response.status);
                                return;
                            }
                            return response.text();
                        }).
                    then(
                        function (html) {
                            document.getElementById('divPagination' + controllername).innerHTML = html;
                        }).
                    then(
                        function () {
                            //Вызов JQuery
                            pgrid_function();
                            if (record_id !== 0) {
                                console.log('Пошло позиционирование на ' + record_id);
                                locate_model(record_id);
                            }
                            else
                                detail_function();
                        }).catch(function (err) { console.log('Fetch Error :-S', err); })
            }
    ).catch(function (err) { console.log('Fetch Error :-S', err); });
}
function SetPagination(i, controllername) {
    //Скинул/установил активность
    /*let name = "@Model.ControllerName"+i;
    let lis = document.getElementById(name).parentElement.getElementsByTagName('li');
    for (let li of lis) {
        //скинуть класс
        li.classList.remove("active");
    }
    document.getElementById(name).classList.toggle("active");*/

    //Рабочая схема
    /*var xhttp = new XMLHttpRequest();

    xhttp.open("POST", "/Home/RefreshModels", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    var params = "page="+i;
    xhttp.send(params);

    xhttp.onload = function(response) {

        if(response.target.status == 200) {
            document.getElementById('dvModels').outerHTML = response.target.response;
        }

     };*/
    
    //fetch
    fetch('/Home/Refresh' + controllername, {
        method: "POST",
        headers: { "Content-type": "application/x-www-form-urlencoded" },
        body: 'page=' + i
    })
        .then(function (response) {
            if (response.status !== 200) {
                console.log('Looks like there was a problem. Status Code: ' + response.status);
                return;
            }
            return response.text();
        }).
        then(
            function (html) {
                document.getElementById('dv' + controllername).outerHTML = html;
                //---------------------Вызов перестройки пагинации------------///
                fetch('/Home/' + controllername +'Pagination', {
                    method: "POST",
                    headers: { "Content-type": "application/x-www-form-urlencoded" },
                    body: 'page=' + i
                }).
                    then(
                        function (response) {
                            if (response.status !== 200) {
                                console.log('Looks like there was a problem. Status Code: ' + response.status);
                                return;
                            }
                            return response.text();
                        }).then
                    (
                        function (html) {

                            document.getElementById('divPagination' + controllername).innerHTML = html;
                            //PrepareModelGrid();
                        }
                    )
                //---------------------Вызов перестройки пагинации------------///
            }).catch(function (err) { console.log('Fetch Error :-S', err); });
}
//Добавил в Branch_4
// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.
