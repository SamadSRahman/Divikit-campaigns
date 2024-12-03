/* eslint-disable @typescript-eslint/no-explicit-any */


import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IoIosSave, IoMdEye } from 'react-icons/io';
import styles from './Profile.module.css';
import { MdPublish } from "react-icons/md";

import {
  addTemplatesSuffix,
  convertDictToPalette,
  convertPaletteToDict,
  DivProEditor,
  removeTemplatesSuffix,
} from '../../lib'; // Adjust this import path as needed
import useCampaign from '../../lib/utils/useCampaign'
import useLayout from '../../lib/utils/useLayout';
import ReactHeader from '../../lib/components/ReactHeader';
import QuizStyleInputPopup from '../../components/QuizStyleInputPopup';
import { isContactUs } from '../../lib/utils/services';
import { contactUsJSON } from '../../lib/utils/splashScreenData';
import PreviewScreen from '../../components/PreviewScreen';

const ProfileDesign = () => {
  const { campaignId, page, userId } = useParams();
  const { getCampaignById, currentLayout, layoutId,  } = useCampaign();
  const { updateLayout, createLayout, getAllLayout, getAllLayoutNames, screens } = useLayout();
  const navigate = useNavigate();
  const [jsonContent, setJsonContent] = React.useState(null);
  const [editorInstance, setEditorInstance] = React.useState(null);
  const editorContainerRef = React.useRef(null);
  const [showQuizPopup, setShowQuizPopup] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);


  React.useEffect(() => {
    console.log("userId", userId);
    
    const token = localStorage.getItem('accessToken')
    if (!token) {
      alert("Please login to access your campaigns")
      navigate('/')
    }
    if (campaignId) {
      getCampaignById(campaignId, page);
      getAllLayoutNames(campaignId);
      if (page === "quiz_screen") {
        handleAddQuestion();
      }
    }
  }, [campaignId, page]);


  React.useEffect(() => {
    const screenWidth = window.innerWidth;
    const leftRightWidth = 0.25 * screenWidth;
    const middleWidth = 0.4 * screenWidth;
    if (!editorContainerRef.current) return;
    const editor = (window.editor = DivProEditor.init({
      renderTo: editorContainerRef.current,
      locale: 'en',
      rootConfigurable: true,
      card: {
        json: currentLayout,

      },

      theme: 'dark',
      layout: [
        {
          items: ['new-component', 'component-tree'],
          minWidth: leftRightWidth,
        },
        {
          items: ['preview'],
          weight: 5,
          minWidth: leftRightWidth,
        },
        {
          items: ['component-props:code', 'custom-variables'],
          minWidth: leftRightWidth,
        },
      ],
      actionLogUrlVariable: 'on_click_log_url',
      paletteEnabled: true,
      cardLocales: [
        {
          id: 'ru',
          text: {
            ru: 'RU',
            en: 'RU',
          },
        },
        {
          id: 'en',
          text: {
            ru: 'EN',
            en: 'EN',
          },
        },
      ],
      sources: [
        {
          key: 'test',
          url: 'https://ya.ru/api',
          example: {
            logged: 1,
            login: 'Vasya',
            mailCount: 123,
          },
        },
      ],
      customActions: [
        {
          baseUrl: 'div-screen://close',
          text: {
            ru: 'Закрыть',
            en: 'Close',
          },
        },
        {
          baseUrl: 'div-screen://open',
          text: {
            ru: 'Открыть',
            en: 'Open',
          },
          args: [
            {
              type: 'string',
              name: 'id',
              text: {
                ru: 'ID',
                en: 'ID',
              },
            },
          ],
        },
        {
          baseUrl: 'div-screen://next_slide',
          text: {
            ru: 'Следующий',
            en: 'Next',
          },
        },
      ],

      // readOnly: true,
      api: {
        onChange: (newJson) => handleQuiz(newJson),
        getTranslationKey(key) {
          return new Promise(resolve => {
            console.log("key", key, resolve);
          });
        },
        getTranslationSuggest(query) {
          return new Promise(resolve => {
            setTimeout(() => {
              const obj = {};
              const folders = [
                ...new Set(
                  Object.keys(obj)
                    .filter(key => key.includes('.'))
                    .map(key => key.split('.')[0] + '.')
                ),
              ];

              resolve(
                folders
                  .concat(Object.keys(obj))
                  .filter(
                    key =>
                      key.startsWith(query) &&
                      !(query.endsWith('.') && key === query)
                  )
                  .map(key => {
                    return {
                      key,
                      text: String(obj[key as keyof typeof obj]),
                    };
                  })
              );
            }, Math.random() * 500);
          });
        },
      },
    }));
    setEditorInstance(editor);
    return () => {
      // Clean up the editor if necessary
      if (editor && typeof editor.destroy === 'function') {
        editor.destroy();
      }
    };
  }, [currentLayout, page]);

  async function handleQuiz(json: string) {
    const jsonData = JSON.parse(json);
    localStorage.setItem("variables", JSON.stringify(jsonData.card.variables));
    const quizComponent = jsonData?.card?.states[0]?.div?.items?.find((ele: string) => ele.type === "_quiz");
    const contactUsComponent = jsonData?.card?.states[0]?.div?.items?.find((ele: string) => ele.type === "_template_contact_us");
    if(contactUsComponent){
      if(!isContactUs()){
        await createLayout(JSON.stringify(contactUsJSON), campaignId, "contact_us_screen");
        await getAllLayoutNames(campaignId);
        await getAllLayout(campaignId);
        console.log("line 204",screens);
        
      }
    }
    if (screens.find((ele: { path: string }) => ele.path === "quiz_screen") === undefined) {
      try {
        // await handleLogJSON();
        // await createLayout(JSON.stringify(quizJSON), campaignId, "quiz_screen");
        // refreshScreenNames();
        // navigate(`/editor/${campaignId}/quiz_screen`);
      } catch (error) {
        console.error('Error handling quiz:', error);
      }
    }
  }



  const handleLogJSON = async () => {
    if (!editorInstance) {
      console.log('Editor not initialized');
      return;
    }

    try {
      const currentJSON = editorInstance.getValue();
      setJsonContent(currentJSON);
      await updateLayout(layoutId, currentJSON, page, campaignId);
    } catch (error) {
      console.error('Error handling JSON:', error);
    }
  };


  function refreshScreenNames() {
    console.log("refreshScreenNames");
    getAllLayout(campaignId)
  }
  const handleQuizSubmit = (quizData: any) => {
    const currentJson = JSON.parse(editorInstance.getValue());
    
    // Create quiz component structure
    const quizComponent = {
      type: "container",
      margins: { top: 20 },
      items: [
        {
          type: "container",
          items: [
            {
              type: "text",
              text: `Question ${quizData.questionNumber}: ${quizData.question}`,
              font_size: 22,
              font_weight: "bold",
              margin: { bottom: 16, top:20 },
              text_alignment_horizontal: "center"
            }
          ],
          orientation: "overlap"
        },
        {
          type: "gallery",
          width: { type: "match_parent" },
          height: { type: "fixed", value: 61 },
          alignment_horizontal: "left",
          alignment_vertical: "top",
          margins: { top: 47, right: 7, left: 7 },
          items: quizData.answers.map((answer: string, index: number) => ({
            type: "_template_button",
            text: answer,
            margin: { bottom: 8 },
            actions: [
              {
                question: quizData.question,
                options: quizData.answers,
                selected: answer,
                correct: quizData.answers[quizData.correctAnswer],
                log_id: `answer_${index}`,
                url: `quiz://answer?selected=${index}&correct=${quizData.correctAnswer}`
              }
            ],
            paddings: {
              top: 12,
              right: 15,
              bottom: 12,
              left: 15
            },
            text_alignment_horizontal: "center"
          })),
          cross_content_alignment: "center",
          item_spacing: 20,
          orientation: "horizontal",
          background: [
            {
              type: "solid",
              color: "#edc7c7"
            }
          ]
        }
      ]
    };

    // Get the current items or initialize empty array
    const currentItems = currentJson.card.states[0].div.items || [];
    
    // Update the div structure with the new quiz component
    currentJson.card.states[0].div = {
      ...currentJson.card.states[0].div,
      items: [...currentItems, quizComponent]
    };

    // Update the card

    updateLayout(layoutId, JSON.stringify(currentJson), page, campaignId);
    getCampaignById(campaignId, page);
  
    const card = editorInstance.getCard();
    if (card) {
      card.json = currentJson;
    }
  };

  const handleAddQuestion = () => {
    // setQuestionCount(prev => prev + 1);
    // setShowQuizPopup(true);
  };

  return (
    <div ref={editorContainerRef} style={{ maxWidth: '100vw', height: '100vh', boxSizing: 'border-box',  }}>
      <ReactHeader screens={[]} refreshScreenNames={refreshScreenNames} />
      <div>
        {showQuizPopup && (
          <QuizStyleInputPopup
            questionNumber={1}
            onSubmit={handleQuizSubmit}
            onClose={() => setShowQuizPopup(false)}
          />
        )}
        <div className="flex gap-2 absolute bottom-4 right-4">
          <button
            onClick={() => setIsPreviewOpen(true)}
            className={styles.addQuestionBtn}
          >
            <IoMdEye /> Preview
          </button>
          <button
            className={styles.saveBtn}
            onClick={handleLogJSON}
          >
            <IoIosSave />
            Save
          </button>
        </div>
        <button className={styles.finishBtn}
          onClick={() => navigate(`/publish/${campaignId}`)}
        >
          <MdPublish />
          Publish
        </button>
      </div>

      <PreviewScreen
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        jsonData={editorInstance?.getValue()}
      />
    </div>
  );
};

window.convertDictToPalette = convertDictToPalette;
window.convertPaletteToDict = convertPaletteToDict;

window.addTemplatesSuffix = addTemplatesSuffix;
window.removeTemplatesSuffix = removeTemplatesSuffix;

export default ProfileDesign;
