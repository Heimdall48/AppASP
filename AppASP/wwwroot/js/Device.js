$(document).ready(
    function () {

        //Класс определяющий состояние прибора
        class DeviceClass {
            ID = 0;
            Operation = null;//Возможные значения кроме null - U,I
            DeviceEF = null;

            ClearDevice() {
                this.ID = 0;
                this.Operation = null;
            }
            SetInsertOperation(){
                this.Operation = 'I';
            }

            SetUpdateOperation() {
                this.Operation = 'U';
            }

            IsUpdateOperation() { return this.Operation == 'U'; }
            IsInsertOperation() { return this.Operation == 'I'; }

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
        }

        //Через этот объект, а не через всякие теги будем пытаться работать
        let vDevice = new DeviceClass();

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

            if (!vDevice.Operation) {
                alert('Ошибка с определением типа операции над прибором!');
                return;
            }

            //Проверяем что щас делаем
            if (vDevice.IsInsertOperation()) {
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

            if ($('#device_body tr[data-id="' + pID + '"]'))
                vDevice.ID = pID;
            else
                vDevice.ID = 0;
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
                       //Необходимо переоткрыть грид и спозиционироваться
                       $.ajax({
                           type: 'POST',
                           url: GetPath() + '/GetViewDevices',
                           data: { 'pModel_ID': vModel_ID },
                           success: function (data) {
                               $('#dvDevices').replaceWith(data);
                               PrepareDeviceGrid();
                               LocateDevice(vID);
                           },
                           error: function (jqxhr, status, errorMsg) {
                               alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                           }
                       });
                       //----------------------------------------------------
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
            //Если нет текущего, то посылаем
            var vId = GetCurrentDevice_ID();

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
                    $('#dvDevices').replaceWith(data);
                    vDevice.ClearDevice();
                    PrepareDeviceGrid();
                },
                error: function (jqxhr, status, errorMsg) {
                    alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                }
            });
        }

        function GetDeviceModel_ID() {
            return $("#cbModels").val();
        }

        function GetCurrentDevice_ID() {
            return vDevice.ID;
        }

       
        $('#btnDeviceAdd').click(function () {
            var vId = GetDeviceModel_ID();
            if (vId == "0" || vId === undefined) {
                alert("Не выбрана текущая модель");
                return;
            }
            vDevice.SetInsertOperation(); 
            vDevice.InitDeviceEF();
        });

        $('#btnDeviceUpdate').click(function () {
            //Если нет текущего, то посылаем
            var vId = GetCurrentDevice_ID();

            if (vId == "0" || vId === undefined) {
                alert("Не выбран прибор для редактирования");
                return;
            }

            vDevice.SetUpdateOperation();
            vDevice.InitDeviceEF();
        });

        $('#cbModels').change(
            function () {
                Model_ID = $(this).val();
                //Загрузка приборов модели
                RefreshDevices(Model_ID);

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
            vDevice.ClearDevice();
            document.getElementById('dvDevices').innerHTML = "";
            document.getElementById('divPaginationDevices').innerHTML = "";
        }

        function PrepareDeviceGrid() {
            $('#device_body tr').click(function () {
                $('#device_body tr').removeClass('selectlines');
                $(this).toggleClass('selectlines');
                //Идентификатор вида продукции
                var vDevice_ID = $(this).data("id");
                vDevice.ID = vDevice_ID;
            });
        }

        //Функция вывода приборов для модели
        function RefreshDevices(pModel_ID) {
            ClearDevices();

            $.ajax({
                type: 'POST',
                url: GetPath() + '/GetViewDevices',
                data: { 'pModel_ID': pModel_ID },
                success: function (data) {
                    $('#dvDevices').replaceWith(data);
                    PrepareDeviceGrid();
                },
                error: function (jqxhr, status, errorMsg) {
                    alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                }
            });
        }
 });