<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@page import="java.io.*" %>
<%@page import="Gestione.Server"%>

  <!DOCTYPE html>
   <html>
     <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Riceve i dati e li memorizza</title>
        <link rel="stylesheet" href="../css/style.css" type="text/css">
     </head>
    <body>
        <h2> memorizzazione dei dati </h2>
        <%
         //ricezione dati del Server
         String lat = request.getParameter("lat");
         String lon = request.getParameter("long");
         String name = request.getParameter("nome");
         String address = request.getParameter("indirizzo");
        
         //creazione di un oggetto punto della classe Server
         Server punto=new Server(lat,lon,name,address);

        //creazione della stringa da memorizzare nel file testo
         String linea=punto.toString();
        
        //fasi di apertura del file testo
        
        //1.creare una stringa contenente il nome del file
        String FileDati=new String("Desktop/Server.txt");

        //2.creazione dell'oggetto stream
        //se non esiste lo crea
        FileWriter file=new FileWriter(FileDati,true);

        //3.Creazione dell'oggetto del flusso di scrittura
        PrintWriter scrivi = new PrintWriter(file);
        
        //scrittura della linea contenente i dati di interesse
        scrivi.println(linea);
        
        //chiusura file
        scrivi.close();
        
        %>
        <%
          String curDir = System.getProperty("user.dir");

          out.println("\nIl file si trova nella cartella:");
          out.println(" ++ " + curDir);
         %>
      </body>
   </html>
