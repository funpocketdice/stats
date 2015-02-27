var app = angular.module('project', ['btford.socket-io', 'highcharts-ng']);

app.controller('projectController', ['$scope', '$interval', 'socket', function($scope, $interval, socket){

    $scope.showRollsGraph = true;

    $scope.rolls = $scope.wagered = $scope.payout = $scope.wins = $scope.loses = $scope.dices = 0;
    $scope.spentTime = 0

    $scope.max = {
        betAmount: 0,
        payout: 0,
        balance: 0,
    };

    $scope.rollsByType = {}

    $interval(function(){
        $scope.spentTime++;
    }, 1000);

    $scope.chartConfig = {
        options: {
            chart: {
                type: 'line',
                zoomType: 'x',
            },
            plotOptions: {
                series: {
                    turboThreshold: 0,
                }
            }
        },
        series: [{
            name: 'Bet amount',
            data: []
        }],
        xAxis: {
            type: 'datetime',
        },
        useHighStocks: true
    }

    $scope.rollsByTypeConfig = {
        options: {
            chart: {
                type: 'column',
                zoomType: 'x',
            },
        },
        xAxis: {
            categories: []
        },
        title: ' ',
        series: [{
            name: 'Rolls count by type',
            data: [],
            dataLabels: {
                enabled: true,
                y: 20,
                color: '#ffffff',
            }
        }],
    };

    mySocket.on('roll', function(data){
        if ($scope.showRollsGraph){
            $scope.chartConfig.series[0].data.push({
                x: new Date().getTime(),
                y: data.data.roll.betAmount,
                marker: {
                    enabled: true,
                    fillColor: data.data.roll.win ? 'green' : 'red',
                    lineColor: null,
                }
            });
        }


        $scope.rolls++;

        $scope.wagered += data.data.roll.betAmount;
        $scope.payout += data.data.roll.result.payout;
        $scope.dices += data.data.roll.result.dices[0] + data.data.roll.result.dices[1] || 0;

        if (data.data.roll.win)
            $scope.wins++;
        else
            $scope.loses++;

        //maxs
        if ($scope.max.betAmount < data.data.roll.betAmount){
            $scope.max.betAmountUser = data.data.roll.userName;
            $scope.max.betAmount = data.data.roll.betAmount;
        }
        if ($scope.max.payout < data.data.roll.result.payout){
            $scope.max.payoutUser = data.data.roll.userName;
            $scope.max.payout = data.data.roll.result.payout;
        }

        if ($scope.max.balance < data.data.roll.result.balance){
            $scope.max.balanceUser = data.data.roll.userName;
            $scope.max.balance = data.data.roll.result.balance;
        }

        //roll types
        var textType;
        if (data.data.roll.type == 3){
            textType = 'double';
        }else{
            textType = (data.data.roll.type == 1 ? 'over' : 'under') + ' ' + data.data.roll.number
        }
        if (!$scope.rollsByType[textType]) $scope.rollsByType[textType] = 0;
        $scope.rollsByType[textType]++;

        $scope.rollsByTypeConfig.xAxis.categories = Object.keys($scope.rollsByType);
        $scope.rollsByTypeConfig.series[0].data = [];
        angular.forEach($scope.rollsByType, function(value, key){
            $scope.rollsByTypeConfig.series[0].data.push(value);
        });
    })



}]);

app.factory('socket', function (socketFactory) {

    var myIoSocket = io.connect('https://pocketdice.io');

    mySocket = socketFactory({
        ioSocket: myIoSocket
    });

    return mySocket;
});

app.filter('secondsToTime', function(){
    return function(time){
        if (time <=0) return '0 seconds';

        var hours = Math.floor(time / (60 * 60));

        var divisor_for_minutes = time % (60 * 60);
        var minutes = Math.floor(divisor_for_minutes / 60);

        var divisor_for_seconds = divisor_for_minutes % 60;
        var seconds = Math.ceil(divisor_for_seconds);

        return (hours ? hours + ' hours ' : '') + (minutes ? minutes + ' minutes and ' : '') + (seconds + ' seconds');
    }
})