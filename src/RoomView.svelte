<script>
    import EventItem from './EventItem.svelte';
    import SmallEventItem from './SmallEventItem.svelte';
    import MatrixAvatar from './MatrixAvatar.svelte';

    import { eventDisplayType } from './event-utils.js';

	import { createEventDispatcher, tick, onMount, onDestroy, getContext, beforeUpdate, afterUpdate } from 'svelte';
    import { matrixcs, key } from './matrix.js';
    
	const { getClient } = getContext(key);
    const client = getClient();

    export let roomId;
    let room;

    let timelineWindow;

    let scrolledToBottom = true;
    let oldDistanceFromBottom = 0;
    let initialLoad = true;
    let eventlist;

    let width = 100;

    const dispatch = createEventDispatcher();

    function getPreviousDisplayEvent(event, events) {
        let i = events.findIndex(e => e.getId() === event.getId());
        let previousDisplayEventIndex = i-1;
        while (previousDisplayEventIndex >= 0) {
            let event = events[previousDisplayEventIndex];
            switch (eventDisplayType(event)) {
                case "DISPLAY":
                case "SMALL":
                    return event;
                default:
                    previousDisplayEventIndex--;
                    break;
            }
        }
        return null;
    }

    function shouldShowSender(event) {
        
        let prevEvent = getPreviousDisplayEvent(event, timelineWindow.getEvents());
        if (prevEvent === null) { return true; }

        if (shouldShowDateSeparator(event)) { return true; }

        switch (eventDisplayType(prevEvent)) {
            case "DISPLAY":
                return (event.getSender() != prevEvent.getSender()) ||
                        (event.getTs()-prevEvent.getTs() > 300000);
            case "SMALL":
                return true;
            default:
                break;
        }

        return true;
    }

    function shouldShowDateSeparator(event) {

        if (event.getType() === 'm.room.create') { return true; }

        let prevEvent = getPreviousDisplayEvent(event, timelineWindow.getEvents());
        if (prevEvent === null) { return false; }

        let eventDate = new Date(event.getTs());
        let previousEventDate = new Date(prevEvent.getTs());

        return !(
            eventDate.getFullYear() === previousEventDate.getFullYear() &&
            eventDate.getMonth() === previousEventDate.getMonth() &&
            eventDate.getDate() === previousEventDate.getDate()
        );

    }

    function onRoomTimeline(event, eventRoom, toStartOfTimeline, removed, data) {
        if (eventRoom.roomId == roomId) {
            room = room;
            
            //if (scrolledToBottom) {
                timelineWindow.paginate(
                    matrixcs.EventTimeline.FORWARDS,
                    1
                ).then(()=>{
                    timelineWindow = timelineWindow;
                })
            //}
        }
    }

    onMount(async () => {
        await tick();
        room = client.getRoom(roomId);
        await room.loadMembersIfNeeded();
        timelineWindow = new matrixcs.TimelineWindow(
            client, room.getTimelineSets()[0]
        );
        await timelineWindow.load();
        client.on("Room.timeline", onRoomTimeline);
        checkScrolledToTop();
    });

    onDestroy(() => {
        client.removeListener("Room.timeline", onRoomTimeline);
    })

    beforeUpdate(async () => {
        room = room;

        if (!initialLoad) {
            if (eventlist) {
                //scrolledToBottom = eventlist.clientHeight + eventlist.scrollTop > eventlist.scrollHeight - 20;
                //oldDistanceFromBottom = eventlist.scrollHeight-eventlist.scrollTop;
                scrolledToBottom = true;
                oldDistanceFromBottom = 0;
            }
        } else {
            initialLoad = false;
        }
	});

	afterUpdate(() => {
        reflow();
    });
    
    function reflow() {
        if (eventlist) {
            /*if (scrolledToBottom) {*/ eventlist.scrollTo(0, eventlist.scrollHeight); /*}*/
            //else { eventlist.scrollTo(0, eventlist.scrollHeight-oldDistanceFromBottom); };
            //checkScrolledToTop();
        }
    }

    let timelineTopPlaceholder;
    //let scrollBackPromise;

    let beginningOfTime = false;

    function checkScrolledToTop() {
        /*if (eventlist && timelineTopPlaceholder) {
            const windowBounds = eventlist.getBoundingClientRect();
            const placeholderBounds = timelineTopPlaceholder.getBoundingClientRect();

            if (placeholderBounds.bottom >= windowBounds.top && scrollBackPromise === undefined) {
                scrollBackPromise = scrollBack();
            }
        }*/
    }

    function scrollBack() {
        if (timelineWindow === undefined) {
            return Promise.reject({message:"no timeline"});
        }
        if (!timelineWindow.canPaginate(matrixcs.EventTimeline.BACKWARDS)) {
            return Promise.reject({message:"can't paginate"});
        }
        return timelineWindow.paginate(
            matrixcs.EventTimeline.BACKWARDS,
            10
        )
            .then(()=>{
                room = room;
                scrollBackPromise = undefined;
                if (timelineWindow.getEvents()[0].getType() === 'm.room.create') {
                    beginningOfTime = true;
                }
            })
            .catch(()=>{
                console.log("pagination failed!");
            });
    }
</script>

<style>
.container {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    height: 100%;
}
.eventlist {
    display: flex;
    box-sizing: border-box;
    flex-direction: column;
    max-height: 100%;
    overflow-y: scroll;
    flex-grow: 1;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none;  /* IE 10+ */
}
.eventlist::-webkit-scrollbar {
    width: 0px;
    background: transparent; /* Chrome/Safari/Webkit */
}
.spacer {
    flex-grow: 1;
}
.event {
    position: relative;
}

.dateseparator {
  margin: 0.3em;
  text-align: center;
  border-bottom: 1px solid var(--thin-border-color);
  font-size: 0.9rem;
  margin-bottom: 0.4em;
}
</style>

<div class="container" bind:clientWidth={width}>
    {#if room}
        <div bind:this={eventlist} on:scroll={checkScrolledToTop} class="eventlist">
            <div class="spacer"></div>
            {#if timelineWindow}
                <div class="timelineTopPlaceholder" bind:this={timelineTopPlaceholder}>
                </div>
                {#each timelineWindow.getEvents() as event (event.getId())}
                    {#if eventDisplayType(event) != "NONE" && shouldShowDateSeparator(event)}
                        <div class="dateseparator">
                            {new Date(event.getTs()).toDateString()}
                        </div>
                    {/if}
                    {#if eventDisplayType(event) == "DISPLAY"}
                        <div class="event"><EventItem on:reflow={reflow} {width} {room} {event} showSender={shouldShowSender(event)}></EventItem></div>
                    {:else if eventDisplayType(event) == "SMALL"}
                        <div class="event"><SmallEventItem on:reflow={reflow} {event}}></SmallEventItem></div>
                    {/if}
                {/each}
            {:else}
            loading...
            {/if}
        </div>
    {:else}
        loading...
    {/if}
</div>
