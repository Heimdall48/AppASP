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

$(document).ready(
    function () {

        function GetPath() {
            var vPath = $('#MyUrl').val();
            return vPath;
        }

        $('#exampleModal').on('shown.bs.modal', function (event) {
            $('#edModelName').focus();
        });

        $('#exampleModal').on('show.bs.modal', function (event) {
            //Прячем сообщение об ошибках
            /*var ErrorSpan = document.getElementById("SaveErrorDeviceType");
            if (ErrorSpan != null)
                ErrorSpan.style.display = "none";*/

            //Проверяем что щас делаем
            var vID = $("#Model_ID").val().trim(); 
            if (vID == 0) {
                $(this).find('#exampleModalLabel').text("Добавить модель");
                $(this).find('#edModelName').val("");
                $(this).find('#edModelDescription').val("");
            }
            else {
                $(this).find('#exampleModalLabel').text("Изменить вид продукции");
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
                        $('#divImageResult').replaceWith(data);
                    },
                    error: function (jqxhr, status, errorMsg) {
                        $('#divImageResult').html('<b>Произошла ошибка в процесе получения изображения!</b>');
                        alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                    }
                });
            }
        });

        $('#btnModelSave').click(function () {

            var vName = $("#edModelName").val().trim();
            if (vName == "") {
                alert('Название должно быть задано');
                return;
            }

            ModelEF.hide();
            ModelEF.addEventListener('shown.bs.hidden', event => {
                ModelEF.dispose();
            })



          /*  var vID = $("#DeviceType_ID").val().trim();

            $.ajax({
                type: 'POST',
                url: GetPath() + '/SaveDeviceType',
                data: { 'Name': encodeURIComponent(vName), 'Current_ID': vID, 'Code': vCode },
                success: function (data) {
                    //Текущее представление надо перестроить
                    $('#divSaveDeviceTypeMessage').replaceWith(data);
                    //Если ошибок не существует, то закрываем форму. Здесь 0 - признак ошибки
                    vID = $("#LocateDeviceType_ID").val().trim();
                    if (vID != '0') {
                        $('#ModifyDeviceType').modal('hide');
                        //Необходимо переоткрыть грид и спозиционироваться
                        $.ajax({
                            type: 'POST',
                            url: GetPath() + '/GetViewDeviceTypes',
                            data: {},
                            success: function (data) {
                                $('#dvDeviceTypes').replaceWith(data);
                                PrepareDeviceTypeGrid();
                                Locate(vID);
                            },
                            error: function (jqxhr, status, errorMsg) {
                                alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                            }
                        });
                        //----------------------------------------------------
                    }
                },
                error: function (jqxhr, status, errorMsg) {
                    $('#divSaveDeviceTypeMessage').html('<b>Произошла ошибка в процесе выполнения!</b>');
                    alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                }
            });*/
        });


        function PrepareModelGrid() {
            //Предварительно подчищаем детальные данные
            // ClearDataDetail();
            $('#model_body tr').click(function () {
                $('#model_body tr').removeClass('selectlines');
                $(this).toggleClass('selectlines');
                //Идентификатор вида продукции
                var vDeviceType_ID = $(this).data("id");
                $("#Current_Model_ID").val(vDeviceType_ID);
                //RefreshDataDetail();
            });
        }

        var ModelEF;

        function InitModelEF() {
            ModelEF = new bootstrap.Modal('#exampleModal', {
                keyboard: true
            })
           ModelEF.show(); 
        }

        PrepareModelGrid();

        $('#btnModelAdd').click(function () {
            $("#Model_ID").val(0);
            InitModelEF();
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

        //Получение текущего вида продукции
        function GetCurrentModel_ID() {
            return $("#Current_Model_ID").val();
        }
    });
