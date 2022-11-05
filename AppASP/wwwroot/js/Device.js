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
                       vDevice.DeviceEF.hide();

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