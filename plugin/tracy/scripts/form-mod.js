const form = (() => {
  const addOnSubmit = elem => {
    [...elem.getElementsByTagName("form")].map(t =>
      t.addEventListener("submit", async e => {
        const inputs = [...e.target.getElementsByTagName("input")];
        console.log("inputs:", inputs.length, inputs);
        //        debugger;
        await Promise.all(
          inputs.map(async t => {
            t.value = await util.send({
              "message-type": "replace",
              msg: t.value
            });
          })
        );
      })
    );
  };

  return { addOnSubmit: addOnSubmit };
})();
