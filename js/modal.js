const abrirTela = document.querySelector('#informacoes');
        const dialog1 = document.querySelector('#dialog1');
        const fecharTela = document.querySelector('#close');

        abrirTela.onclick = function(){
            dialog1.showModal(); 
        }

        fecharTela.onclick = function(){
            dialog1.close();
        }