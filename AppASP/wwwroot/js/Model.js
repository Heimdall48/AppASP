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
                $(this).find('#edRevisionName').val($('#revision_body tr[data-id="' + vID + '"]>td:eq(1)>p').text().trim());
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
                                $('#dvModels').replaceWith(data);
                                PrepareModelGrid();
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

        //Удаление модели
        $('#btnModelDelete').click(function () {
            DeleteModel(true);
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

        function RefreshDataDetail() {
            var vId = GetCurrentModel_ID();
            if (vId == "0" || vId === undefined) {
                vId = 0;
            }
            RefreshRevisions(vId);
        }

        function ClearRevisions() {
            document.getElementById('dvRevisions').innerHTML = "";
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

        function RefreshRevisions(pID) {
            
            ClearRevisions();

            $.ajax({
                type: 'POST',
                url: GetPath() + '/GetViewRevisions',
                data: { 'pModel_ID': pID },
                success: function (data) {
                    $('#dvRevisions').replaceWith(data);
                    PrepareRevisionGrid();
                },
                error: function (jqxhr, status, errorMsg) {
                    alert("Статус: " + status + "; Ошибка: " + errorMsg + "; Описание:" + jqxhr.responseText);
                }
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
                        //Необходимо переоткрыть грид и спозиционироваться
                        $.ajax({
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
                        });
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
                        //Необходимо переоткрыть грид и спозиционироваться
                        $.ajax({
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
                        });
                        //----------------------------------------------------
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
            RefreshDataDetail();
        }

        function Locate(pID) {
            $('#model_body tr').removeClass('selectlines');
            $('#model_body tr[data-id="' + pID + '"]').toggleClass('selectlines');
            //Идентификатор вида продукции
            $("#Current_Model_ID").val(pID);
            RefreshDataDetail();
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
                RefreshDataDetail();
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

        //Получение текущего вида продукции
        function GetCurrentModel_ID() {
            return $("#Current_Model_ID").val();
        }

        function GetCurrentRevision_ID() {
            return $("#Current_Revision_ID").val();
        }
    });
