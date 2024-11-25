/* eslint-disable brace-style */
/* eslint-disable arrow-parens */
/* eslint-disable keyword-spacing */
/* eslint-disable space-before-blocks */
/* eslint-disable space-before-function-paren */
/* eslint-disable no-console */
/* eslint-disable quotes */
/* eslint-disable indent */
import axios from "axios";
import { useEffect, useState } from "react";
import {  getScreenName, getScreenPath } from "./services";

export default function useLayout() {
    const channel = localStorage.getItem("channel");
    const [layouts, setLayouts] = useState([])
    const token = localStorage.getItem("accessToken");
    const [isLayoutCreated, setIsLayoutCreated] = useState(false)



    const createLayout = async (jsonData, campaignId, page) => {
        try {
            const response = await fetch(
                `https://pre.xplore.xircular.io/api/v1/layout/create/${campaignId}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        authorization: token,
                        session: channel
                    },
                    body: JSON.stringify({
                        name: getScreenPath(page),
                        layoutJSON: JSON.parse(jsonData)
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json(); // Capture the error response
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Layout created successfully', data);
            setIsLayoutCreated(true);
        } catch (error) {
            console.log('Error posting layout data:', error);
            alert(error.message || 'Failed to publish layout. Please try again.');
        }
    };

    const deleteLayout = async (id)=>{
        if (!window.confirm('Are you sure you want to delete this screen?')) {
            return;
        }
        try {
            const response = await axios.delete(`https://pre.xplore.xircular.io/api/v1/layout/delete/${id}`,{
                headers: {
                    authorization: token,
                    session: channel
                }
            })
            console.log('Response:', response);
        } catch (error) {
            console.log('Error deleting layout:', error);
        }
    }


    const updateLayout = async (id, layout, name) => {
        try {
            const response = await axios.put(
                `https://pre.xplore.xircular.io/api/v1/layout/update/${id}`,
                {
                    // Pass the body content as a JavaScript object
                    name: getScreenPath(name),
                    layoutJSON: JSON.parse(layout), // Parse `layout` to a JSON object
                },
                {
                    headers: {
                        "Content-Type": "application/json", // Specify the content type
                        authorization: `${token}`, // Include the authorization token
                        session: channel,
                    },
                }
            );
            console.log("Response:", response.data);
            alert("Layout saved succssfully");
            // if (name === "splash_screen") {
            //     window.location.href = `/editor/${campaignId}/landing_screen`;
            // } else {
            //     window.location.href = `/publish/${campaignId}`;
            // }
        } catch (error) {
            console.error("Error updating layout:", error);
        }
    };

    const getAllLayout = async (id)=>{
        console.log("id line 101", id);
        
        try {
            const response = await axios.get(`https://pre.xplore.xircular.io/api/v1/layout/getAll/${id}`)
            console.log(response.data.layouts)
            setLayouts(response.data.layouts)
            const campaignScreens = response.data.layouts.map(ele=>ele);
            
        const formattedScreens = campaignScreens.map(screen => ({
            name: getScreenName(screen.name),
            path: getScreenPath(screen.name),
            id: screen.layoutID
        }));
        console.log(formattedScreens);
        localStorage.setItem('screens', JSON.stringify(formattedScreens))
          
        } catch (error) {
            console(error)
        }
    }
    useEffect(()=>{
        console.log("layouts line 122", layouts);
    },[layouts])
    return {
        updateLayout,
        createLayout,
        getAllLayout,
        deleteLayout,
        layouts,
        isLayoutCreated,
    };
}
