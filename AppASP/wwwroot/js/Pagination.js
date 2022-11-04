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
    //Branch Pagination
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