using Microsoft.AspNetCore.Mvc;
using webapi.Data.Examples;
using webapi.Models.Flexibility;
using webapi.Models.User;
using webapi.Services;

namespace webapi.Controllers
{
    [ApiController]
    [Route("flexibility-training")]
    public class FlexibilityTrainingController(IFlexibilityExerciseService exerciseService) : Controller
    {
        private readonly IFlexibilityExerciseService _exerciseService = exerciseService;

        [HttpPut(template: "setSuitabilityExercises")]
        private IActionResult SetSuitabilityExercises()
        {
            try
            {
                _exerciseService.SetSuitabilityExercises(SuitabilityExamples.GetExamples());
                return Ok();
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }

        [HttpGet(template: "{language}/getSuitabilityExercise/{id}")]
        public ActionResult<SuitabilityExercise> GetSuitabilityExercise(Language language, long id)
        {
            try
            {
                Console.WriteLine($"🔍 GetSuitabilityExercise called: id={id}, language={language}");
                var exercise = _exerciseService.GetSuitabilityExerciseById(id, language);
                if (exercise == null)
                {
                    Console.WriteLine($"❌ Exercise not found: id={id}");
                    return NotFound();
                }
                Console.WriteLine($"✅ Exercise found: id={id}");
                return exercise;
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }

        [HttpPut(template: "setEfficiencyExercises")]
        private IActionResult SetEfficiencyExercises()
        {
            try
            {
                _exerciseService.SetEfficiencyExercises(EfficiencyExamples.GetExamples());
                return Ok();
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }

        [HttpGet(template: "{language}/getEfficiencyExercise/{id}")]
        public ActionResult<EfficiencyExercise> GetEfficiencyExercise(Language language, long id)
        {
            try
            {
                Console.WriteLine($"🔍 GetEfficiencyExercise called: id={id}, language={language}");
                var exercise = _exerciseService.GetEfficiencyExerciseById(id, language);
                if (exercise == null)
                {
                    Console.WriteLine($"❌ Efficiency Exercise not found: id={id}");
                    return NotFound();
                }
                Console.WriteLine($"✅ Efficiency Exercise found: id={id}");
                return exercise;
            }
            catch (Exception exception)
            {
                Console.WriteLine($"💥 Error in GetEfficiencyExercise: {exception.Message}");
                return BadRequest(exception.Message);
            }
        }

        [HttpPut(template: "setMatchingExercises")]
        private IActionResult SetMatchingExercises()
        {
            try
            {
                _exerciseService.SetMatchingExercises(MatchingExamples.GetExamples());
                return Ok();
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }

        [HttpGet(template: "{language}/getMatchingExercise/{id}")]
        public ActionResult<MatchingExercise> GetMatchingExercise(Language language, long id)
        {
            try
            {
                Console.WriteLine($"🔍 GetMatchingExercise called: id={id}, language={language}");
                var exercise = _exerciseService.GetMatchingExerciseById(id, language);
                if (exercise == null)
                {
                    Console.WriteLine($"❌ Matching Exercise not found: id={id}");
                    return NotFound();
                }
                Console.WriteLine($"✅ Matching Exercise found: id={id}");
                return exercise;
            }
            catch (Exception exception)
            {
                Console.WriteLine($"💥 Error in GetMatchingExercise: {exception.Message}");
                return BadRequest(exception.Message);
            }
        }

        [HttpPut(template: "setTipExercises")]
        private IActionResult SetTipExercises()
        {
            try
            {
                _exerciseService.SetTipExercises(TipExercisesExamples.GetExamples());
                return Ok();
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }

        [HttpGet(template: "{language}/getTipExercise/{id}")]
        public ActionResult<TipExercise> GetTipExercise(Language language, long id)
        {
            try
            {
                var exercise = _exerciseService.GetTipExerciseById(id, language);
                if (exercise == null)
                {
                    return NotFound();
                }
                return exercise;
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }

        [HttpPut(template: "setPlainExercises")]
        private IActionResult SetPlainExercises()
        {
            try
            {
                _exerciseService.SetPlainExercises(PlainExerciseExamples.GetExamples());
                return Ok();
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }

        [HttpGet(template: "{language}/getPlainExercise/{id}")]
        public ActionResult<PlainExercise> GetPlainExercise(Language language, long id)
        {
            try
            {
                var exercise = _exerciseService.GetPlainExerciseById(id, language);
                if (exercise == null)
                {
                    return NotFound();
                }
                return exercise;
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }

        [HttpPut(template: "setFlexibilityExercises")]
        private IActionResult SetFlexibilityExercises()
        {
            try
            {
                _exerciseService.SetFlexibilityExercises(FlexibilityExamples.GetFlexibilityExercises());
                return Ok();
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }

        [HttpGet(template: "getFlexibilityExercises")]
        public ActionResult<List<FlexibilityExerciseEntry>> GetFlexibilityExercises()
        {
            try
            {
                var exercises = _exerciseService.GetFlexibilityExercises();
                if (exercises == null)
                {
                    return NotFound();
                }
                return exercises;
            }
            catch (Exception exception)
            {
                return BadRequest(exception.Message);
            }
        }
    }
}
